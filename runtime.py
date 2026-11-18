"""Shared runtime state for the local web dashboard and gesture loop."""

from collections import deque
from threading import Event, RLock
from time import time


LOCK = RLock()
STOP_EVENT = Event()
FRAME_JPEG = None
EVENTS = deque(maxlen=24)

STATE = {
    "state": "idle",
    "tracking": "Waiting",
    "gesture": "—",
    "fps": 0,
    "camera": "Off",
    "uptime": 0,
    "error": None,
    "show_dashboard": True,
    "show_landmarks": True,
    "auto_open_earth": True,
    "started_at": None,
}


def add_event(message):
    with LOCK:
        EVENTS.appendleft({"message": str(message), "time": time()})


def set_state(**values):
    with LOCK:
        STATE.update(values)


def get_controls():
    with LOCK:
        return {
            "show_dashboard": STATE["show_dashboard"],
            "show_landmarks": STATE["show_landmarks"],
            "auto_open_earth": STATE["auto_open_earth"],
        }


def update_metrics(**values):
    with LOCK:
        STATE.update(values)
        if STATE["started_at"] is not None and STATE["state"] == "running":
            STATE["uptime"] = max(0, int(time() - STATE["started_at"]))


def publish_frame(jpeg):
    global FRAME_JPEG
    with LOCK:
        FRAME_JPEG = jpeg


def get_frame():
    with LOCK:
        return FRAME_JPEG


def snapshot():
    with LOCK:
        result = dict(STATE)
        result["events"] = list(EVENTS)
        if result["started_at"] is not None and result["state"] == "running":
            result["uptime"] = max(0, int(time() - result["started_at"]))
        return result
