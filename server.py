"""Serve the local dashboard and control the gesture controller."""

import json
import mimetypes
import os
import threading
import time
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

import runtime


HOST = "127.0.0.1"
PORT = int(os.environ.get("GESTURE_EARTH_PORT", "8765"))
WEB_ROOT = Path(__file__).resolve().parent / "web"
WORKER_LOCK = threading.Lock()
WORKER = None


def _run_controller():
    try:
        import main

        main.main(runtime.STOP_EVENT, web_mode=True)
    except Exception as error:
        runtime.set_state(state="error", error=str(error), camera="Error")
        runtime.add_event(f"Controller stopped: {error}")
    else:
        runtime.set_state(state="idle", tracking="Waiting", gesture="—", camera="Off", error=None)
        runtime.add_event("Controller stopped")
    finally:
        runtime.set_state(started_at=None)


class DashboardHandler(BaseHTTPRequestHandler):
    server_version = "GestureEarthDashboard/1.0"

    def log_message(self, _format, *_args):
        return

    def _json(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _serve_file(self, relative_path):
        target = (WEB_ROOT / relative_path).resolve()
        if target != WEB_ROOT.resolve() and WEB_ROOT.resolve() not in target.parents:
            self.send_error(403)
            return
        if not target.is_file():
            self.send_error(404)
            return
        content = target.read_bytes()
        content_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", f"{content_type}; charset=utf-8" if content_type.startswith("text/") or content_type in ("application/javascript", "application/json") else content_type)
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(content)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/status":
            self._json(runtime.snapshot())
        elif path == "/api/stream":
            self._stream_camera()
        else:
            relative = "index.html" if path == "/" else path.lstrip("/")
            self._serve_file(relative)

    def _stream_camera(self):
        self.send_response(200)
        self.send_header("Content-Type", "multipart/x-mixed-replace; boundary=frame")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Connection", "close")
        self.end_headers()
        last_frame = None
        try:
            while True:
                frame = runtime.get_frame()
                if frame is not None and frame is not last_frame:
                    self.wfile.write(b"--frame\r\nContent-Type: image/jpeg\r\nContent-Length: " + str(len(frame)).encode() + b"\r\n\r\n" + frame + b"\r\n")
                    self.wfile.flush()
                    last_frame = frame
                time.sleep(0.05)
        except (BrokenPipeError, ConnectionResetError, OSError):
            return

    def do_POST(self):
        path = urlparse(self.path).path
        if path == "/api/start":
            self._start_controller()
        elif path == "/api/stop":
            runtime.STOP_EVENT.set()
            if runtime.snapshot()["state"] in ("running", "starting"):
                runtime.set_state(state="stopping")
                runtime.add_event("Stop requested")
            self._json({"ok": True, "status": runtime.snapshot()})
        elif path == "/api/control":
            self._update_controls()
        elif path == "/api/open-earth":
            try:
                from config import GOOGLE_EARTH_URL

                opened = webbrowser.open(GOOGLE_EARTH_URL, new=2, autoraise=True)
                if opened:
                    runtime.add_event("Google Earth opened in the default browser")
                self._json({"ok": bool(opened)})
            except (OSError, webbrowser.Error) as error:
                self._json({"ok": False, "error": str(error)}, status=500)
        else:
            self.send_error(404)

    def _read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length > 4096:
            raise ValueError("Request is too large")
        return json.loads(self.rfile.read(length) or b"{}")

    def _start_controller(self):
        global WORKER
        body = self._read_json()
        if isinstance(body.get("auto_open_earth"), bool):
            runtime.set_state(auto_open_earth=body["auto_open_earth"])
        with WORKER_LOCK:
            if WORKER is not None and WORKER.is_alive():
                self._json({"ok": False, "error": "The controller is already running"}, status=409)
                return
            runtime.STOP_EVENT.clear()
            runtime.set_state(state="starting", tracking="Starting", gesture="—", camera="Starting", error=None, started_at=time.time())
            runtime.add_event("Controller starting")
            WORKER = threading.Thread(target=_run_controller, name="gesture-earth-controller", daemon=True)
            WORKER.start()
        self._json({"ok": True, "status": runtime.snapshot()})

    def _update_controls(self):
        try:
            values = self._read_json()
        except (ValueError, json.JSONDecodeError) as error:
            self._json({"ok": False, "error": str(error)}, status=400)
            return
        allowed = ("show_dashboard", "show_landmarks", "auto_open_earth")
        updates = {key: values[key] for key in allowed if isinstance(values.get(key), bool)}
        runtime.set_state(**updates)
        changed = ", ".join(key.replace("_", " ") for key in updates)
        if changed:
            runtime.add_event(f"Settings updated: {changed}")
        self._json({"ok": True, "status": runtime.snapshot()})


def main():
    server = ThreadingHTTPServer((HOST, PORT), DashboardHandler)
    server.daemon_threads = True
    url = f"http://{HOST}:{PORT}"
    print(f"Gesture Earth dashboard: {url}")
    print("Keep this window open while using the dashboard. Press Ctrl+C to exit.")
    try:
        webbrowser.open(url, new=2, autoraise=True)
    except (OSError, webbrowser.Error):
        pass
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nDashboard server stopped.")
    finally:
        runtime.STOP_EVENT.set()
        if WORKER is not None and WORKER.is_alive():
            WORKER.join(timeout=8)
        server.server_close()


if __name__ == "__main__":
    main()
