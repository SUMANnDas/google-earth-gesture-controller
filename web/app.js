const $ = (selector) => document.querySelector(selector);

const ui = {
  toggleButton: $("#toggle-controller"),
  toggleLabel: $("#toggle-label"),
  statusText: $("#status-text"),
  statusIndicator: $("#status-indicator"),
  trackingText: $("#tracking-text"),
  gestureText: $("#gesture-text"),
  uptimeText: $("#uptime-text"),
  cameraPill: $("#camera-pill"),
  cameraValue: $("#camera-value"),
  cameraFooter: $("#camera-footer-text"),
  cameraDot: $(".camera-dot"),
  cameraStage: $(".camera-stage"),
  cameraFeed: $("#camera-feed"),
  cameraPlaceholder: $("#camera-placeholder"),
  pipButton: $("#pip-button"),
  pipCanvas: $("#pip-canvas"),
  pipVideo: $("#pip-video"),
  fps: $("#fps-value"),
  hands: $("#hands-value"),
  mode: $("#mode-value"),
  sidebarCamera: $("#sidebar-camera"),
  sidebarTracking: $("#sidebar-tracking"),
  dashboard: $("#dashboard-toggle"),
  landmarks: $("#landmarks-toggle"),
  autoEarth: $("#auto-earth-toggle"),
  toast: $("#toast"),
};

let activeRuntime = false;
let controlsInitialized = false;
let toastTimer;
let disconnectedShown = false;
let latestStatus = null;
let pipStream = null;

async function api(path, method = "GET", body) {
  const response = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

function showToast(message, isError = false) {
  ui.toast.textContent = message;
  ui.toast.classList.toggle("is-error", isError);
  ui.toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ui.toast.classList.remove("is-visible"), 2800);
}

function formatDuration(seconds) {
  const minutes = Math.floor((seconds || 0) / 60).toString().padStart(2, "0");
  const remainder = Math.floor((seconds || 0) % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function labelForState(state) {
  return ({
    idle: "Ready to start",
    starting: "Starting controller…",
    running: "Controller is running",
    stopping: "Stopping controller…",
    error: "Controller needs attention",
  })[state] || "Ready to start";
}

function renderEvents(events = []) {
  const list = $("#activity-list");
  if (!list) return;
  if (!events.length) {
    list.innerHTML = '<div class="activity-empty">Start the controller to see live activity.</div>';
    return;
  }
  list.innerHTML = events.slice(0, 5).map((event) => {
    const time = new Date(event.time * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `<div class="activity-row"><span class="activity-mark"></span><span>${escapeHtml(event.message)}</span><time>${time}</time></div>`;
  }).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function render(status) {
  latestStatus = status;
  const state = status.state || "idle";
  const running = state === "running";
  const busy = state === "starting" || state === "stopping";
  const error = state === "error";
  activeRuntime = running;

  ui.statusText.textContent = error && status.error ? `Error: ${status.error}` : labelForState(state);
  ui.statusIndicator.className = `status-indicator${running ? " is-running" : ""}${busy ? " is-starting" : ""}${error ? " is-error" : ""}`;
  ui.toggleLabel.textContent = running || state === "stopping" ? "Stop controller" : state === "starting" ? "Starting…" : "Start controller";
  ui.toggleButton.disabled = busy;
  ui.toggleButton.classList.toggle("is-stop", running || state === "stopping");
  ui.toggleButton.querySelector(".play-icon").textContent = running || state === "stopping" ? "■" : "▶";

  const cameraReady = running && status.camera === "Ready";
  ui.trackingText.textContent = status.tracking || "Waiting for camera";
  ui.gestureText.textContent = status.gesture || "—";
  ui.uptimeText.textContent = formatDuration(status.uptime);
  ui.fps.textContent = running ? (status.fps || 0) : "—";
  ui.hands.textContent = running && status.tracking === "Hand detected" ? "1" : "0";
  ui.mode.textContent = running ? (status.gesture && status.gesture !== "—" ? status.gesture : "SEARCHING") : "STANDBY";
  ui.cameraValue.textContent = cameraReady ? "ONLINE" : error ? "ERROR" : "OFFLINE";
  ui.cameraValue.style.color = cameraReady ? "#9ae6cd" : error ? "#ee9388" : "#8091a0";
  ui.cameraPill.classList.toggle("is-online", cameraReady);
  ui.cameraPill.innerHTML = `<span></span> ${cameraReady ? "CAMERA ONLINE" : error ? "CAMERA ERROR" : "CAMERA OFFLINE"}`;
  ui.cameraFooter.textContent = cameraReady ? "Live camera connection" : error ? (status.error || "Camera unavailable") : "Waiting for camera connection";
  ui.cameraDot.classList.toggle("online", cameraReady);
  ui.cameraStage.classList.toggle("is-live", cameraReady);
  ui.cameraFeed.classList.toggle("is-visible", cameraReady && ui.cameraFeed.dataset.hasFrame === "true");
  ui.cameraPlaceholder.classList.toggle("is-hidden", cameraReady && ui.cameraFeed.dataset.hasFrame === "true");
  ui.sidebarCamera.textContent = cameraReady ? "ON" : error ? "ERR" : "OFF";
  ui.sidebarCamera.style.color = cameraReady ? "#9ae6cd" : "";
  ui.sidebarTracking.textContent = status.tracking === "Hand detected" ? "ACTIVE" : running ? "SEARCH" : "IDLE";
  ui.sidebarTracking.style.color = status.tracking === "Hand detected" ? "#9ae6cd" : "";

  if (!controlsInitialized) {
    ui.dashboard.checked = Boolean(status.show_dashboard);
    ui.landmarks.checked = Boolean(status.show_landmarks);
    ui.autoEarth.checked = Boolean(status.auto_open_earth);
    controlsInitialized = true;
  }
  renderEvents(status.events);
}

async function refreshStatus() {
  try {
    const status = await api("/api/status");
    render(status);
    disconnectedShown = false;
  } catch (error) {
    ui.statusText.textContent = "Dashboard server disconnected";
    ui.statusIndicator.className = "status-indicator is-error";
    if (!disconnectedShown) {
      showToast("Can't reach the local controller server. Start it with python server.py.", true);
      disconnectedShown = true;
    }
  }
}

async function setControls() {
  const values = {
    show_dashboard: ui.dashboard.checked,
    show_landmarks: ui.landmarks.checked,
    auto_open_earth: ui.autoEarth.checked,
  };
  try {
    await api("/api/control", "POST", values);
    showToast("Controller settings updated");
  } catch (error) {
    showToast(error.message, true);
  }
}

async function toggleController() {
  const shouldStop = activeRuntime || ui.toggleButton.classList.contains("is-stop");
  ui.toggleButton.disabled = true;
  try {
    const data = shouldStop
      ? await api("/api/stop", "POST", {})
      : await api("/api/start", "POST", { auto_open_earth: ui.autoEarth.checked });
    render(data.status);
    showToast(shouldStop ? "Stop requested" : "Controller starting — allow camera access if prompted");
  } catch (error) {
    showToast(error.message, true);
  } finally {
    ui.toggleButton.disabled = false;
    refreshStatus();
  }
}

async function openEarth() {
  try {
    const result = await api("/api/open-earth", "POST", {});
    if (result.ok) showToast("Google Earth opened in your default browser");
    else showToast(result.error || "Could not open Google Earth", true);
  } catch (error) {
    showToast(error.message, true);
  }
}

function drawPictureInPicture() {
  if (!document.pictureInPictureElement) return;
  const canvas = ui.pipCanvas;
  const context = canvas.getContext("2d");
  const status = latestStatus || {};
  const isLive = status.state === "running" && status.camera === "Ready" && ui.cameraFeed.dataset.hasFrame === "true";

  context.fillStyle = "#08121b";
  context.fillRect(0, 0, canvas.width, canvas.height);
  if (isLive) context.drawImage(ui.cameraFeed, 0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(5, 12, 18, .78)";
  context.fillRect(0, 0, canvas.width, 54);
  context.fillRect(0, canvas.height - 92, canvas.width, 92);

  context.fillStyle = isLive ? "#71d8b2" : "#e8ad72";
  context.beginPath();
  context.arc(22, 27, 5, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#e9f1f3";
  context.font = "600 17px 'DM Sans', Arial, sans-serif";
  context.fillText(isLive ? "LIVE HAND CONTROL" : "CONTROLLER PAUSED", 39, 33);
  context.textAlign = "right";
  context.fillStyle = "#aec0ca";
  context.font = "12px 'DM Mono', Consolas, monospace";
  context.fillText(isLive ? `${status.fps || 0} FPS` : "START CONTROLLER TO RESUME", canvas.width - 18, 32);
  context.textAlign = "left";

  const gesture = isLive && status.tracking === "Hand detected" ? (status.gesture || "MOVE") : "SEARCHING";
  const actions = {
    MOVE: "MOVE CURSOR",
    CLICK: "CLICK",
    DRAG: "DRAG / PAN",
    ZOOM: "ZOOM IN OR OUT",
    ROTATE: "ROTATE MAP VIEW",
    SEARCHING: isLive ? "SHOW YOUR HAND TO CAMERA" : "CAMERA FEED PAUSED",
  };
  context.fillStyle = "#7e9aab";
  context.font = "11px 'DM Mono', Consolas, monospace";
  context.fillText("DETECTED GESTURE", 20, canvas.height - 58);
  context.fillText("CONTROL ACTION", 318, canvas.height - 58);
  context.fillStyle = "#f0f4f6";
  context.font = "600 21px 'Manrope', 'DM Sans', Arial, sans-serif";
  context.fillText(gesture, 20, canvas.height - 25);
  context.fillStyle = "#9ae6cd";
  context.fillText(actions[gesture] || "HAND CONTROL", 318, canvas.height - 25);
  requestAnimationFrame(drawPictureInPicture);
}

async function togglePictureInPicture() {
  if (!document.pictureInPictureEnabled || !ui.pipVideo.requestPictureInPicture) {
    showToast("Picture-in-Picture is not supported in this browser", true);
    return;
  }
  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      return;
    }
    if (!pipStream) {
      pipStream = ui.pipCanvas.captureStream(15);
      ui.pipVideo.srcObject = pipStream;
    }
    await ui.pipVideo.play();
    await ui.pipVideo.requestPictureInPicture();
    drawPictureInPicture();
    showToast("Preview pinned — switch to Google Earth to demonstrate gestures");
  } catch (error) {
    showToast(`Could not open floating preview: ${error.message}`, true);
  }
}

ui.toggleButton.addEventListener("click", toggleController);
$("#open-earth").addEventListener("click", openEarth);
ui.pipButton.addEventListener("click", togglePictureInPicture);
[ui.dashboard, ui.landmarks, ui.autoEarth].forEach((input) => input.addEventListener("change", setControls));

ui.cameraFeed.addEventListener("load", () => {
  ui.cameraFeed.dataset.hasFrame = "true";
  if (activeRuntime) {
    ui.cameraFeed.classList.add("is-visible");
    ui.cameraPlaceholder.classList.add("is-hidden");
  }
});
ui.cameraFeed.addEventListener("error", () => {
  ui.cameraFeed.dataset.hasFrame = "false";
  ui.cameraFeed.classList.remove("is-visible");
  ui.cameraPlaceholder.classList.remove("is-hidden");
});
ui.pipVideo.addEventListener("enterpictureinpicture", () => {
  ui.pipButton.innerHTML = "<span>↙</span> Close preview";
});
ui.pipVideo.addEventListener("leavepictureinpicture", () => {
  ui.pipButton.innerHTML = "<span>↗</span> Float preview";
});

if (!document.pictureInPictureEnabled || !ui.pipVideo.requestPictureInPicture) {
  ui.pipButton.title = "Picture-in-Picture is not supported by this browser";
}

$("#copy-command").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText("python server.py");
    showToast("Command copied to clipboard");
  } catch {
    showToast("Run: python server.py");
  }
});

const navLinks = [...document.querySelectorAll(".nav-link")];
navLinks.forEach((link) => link.addEventListener("click", () => {
  navLinks.forEach((item) => item.classList.toggle("active", item === link));
}));

refreshStatus();
setInterval(refreshStatus, 1200);
