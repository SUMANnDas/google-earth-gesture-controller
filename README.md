<p align="center">
  <img src="assets/img.png" alt="Gesture Earth Controller Banner">
</p>

# 🌍 Gesture Earth Controller

I created Gesture Earth Controller to make exploring Google Earth feel more natural. It uses a webcam to track my hand and turns simple gestures into cursor, click, drag, zoom, and map navigation controls.

I built the gesture recognition with **MediaPipe** and **OpenCV**, and use **PyAutoGUI** to send mouse actions to Google Earth. I also created a local web dashboard so I can start and stop the controller, see the live camera feed, and adjust its display settings from one place.

## ✨ What I built

- Hand-tracked cursor movement
- Pinch gestures for clicking and dragging
- Two-finger zoom control
- Open-palm map rotation and view adjustment
- A local dashboard with live camera preview, tracking status, gesture, FPS, session time, and activity log
- Dashboard controls for starting and stopping tracking, opening Google Earth, and showing or hiding the camera overlay and hand landmarks
- Smoothed cursor movement and automatic Google Earth launch

## 🖐️ Gesture controls

| My gesture | What it does |
|---|---|
| ☝️ Raise my index finger | Move the cursor |
| 🤏 Pinch thumb and index briefly | Click |
| 🤏 Hold the pinch | Drag |
| ✌️ Bring index and middle fingers together, then move vertically | Zoom in or out |
| 🖐️ Hold an open palm, then move my hand | Rotate or adjust the map view |

## 🧰 How the project works

The camera frames are processed by MediaPipe Hands. I use the hand landmarks and fingertip distances to classify each gesture, then route it to the matching cursor, click-and-drag, zoom, or rotation controller. OpenCV draws the optional dashboard and landmark overlays.

The web dashboard is served locally by `server.py`. It reads runtime status and camera frames from `runtime.py`, and its buttons send start, stop, and display-setting commands to the controller.

```text
main.py                 Webcam, hand tracking, and controller loop
gestures.py             Gesture classification
cursor.py               Cursor movement and smoothing
click_drag.py           Pinch click and drag behavior
zoom.py                 Two-finger zoom behavior
rotate.py               Open-palm map movement
utils.py                Landmark and distance calculations
config.py               Camera and gesture tuning values
server.py, runtime.py   Local dashboard server and live state
web/                    HTML, CSS, and JavaScript dashboard
run_dashboard.bat       Windows dashboard launcher
```

## ⚙️ Specifications

| Setting | Value |
|---|---|
| Operating system | Windows 10 / 11 |
| Python | 3.12.3 (tested) |
| Camera input | 640 × 480, default camera (index 0) |
| Hand tracking | One hand; detection and tracking confidence 0.60 |
| MediaPipe | 0.10.14 |
| OpenCV | opencv-contrib-python 4.13.0.92 |
| PyAutoGUI | 0.9.54 |
| Pinch thresholds | 20 px to start; 35 px to release |
| Drag activation | Hold a pinch for 250 ms |
| Zoom settings | 15 px movement threshold; 120 scroll step |

## 🚀 Installation

Clone the repository and move into the project folder:

```bash
git clone https://github.com/henston-dza/gesture-earth.git
cd gesture-earth
```

Create and activate a virtual environment on Windows, then install the dependencies:

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

## 🖥️ Run my web dashboard

Start the local dashboard from the project folder:

```bash
python server.py
```

It opens at [http://127.0.0.1:8765](http://127.0.0.1:8765). On Windows, I can also start it by double-clicking `run_dashboard.bat`. I keep the terminal window open while using the dashboard, then click **Start controller** to begin hand tracking. The first run may ask me to allow Python to use the webcam.

From the dashboard, I can:

- Start and stop the gesture controller
- Open Google Earth in my default browser
- View the camera feed and current tracking information
- Toggle the OpenCV dashboard overlay and hand landmarks
- Choose whether Google Earth opens automatically when tracking starts

The dashboard server listens on my computer only. The controller uses PyAutoGUI to move and click the system cursor, so I keep Google Earth open and focused while navigating. Stopping the controller releases any held mouse button and closes the camera feed.

## Run the original OpenCV window

I can also run the controller without the web dashboard:

```bash
python main.py
```

In this mode, I use `H` to toggle the dashboard overlay, `D` to toggle hand landmarks, and `Q` to quit.

## 🎥 Demo

I shared a demo on [LinkedIn](https://www.linkedin.com/posts/henston-melroy-dsouza_python-computervision-mediapipe-ugcPost-7478811191033643008-d7gI/?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEvlPaUBVB_3EiuU4wV9mAZEFjrA2scFFgQ).

## ⚠️ Known limitations

- I currently track one hand at a time.
- The controller is designed for Windows and Google Earth in a desktop browser.
- In the original OpenCV window mode, moving the preview window may temporarily pause the preview because of OpenCV HighGUI behavior.
- Gesture input is sent to the system cursor, so Google Earth needs to be open and focused for navigation.

## 🔮 What I’d like to improve next

- Add multi-hand support
- Let users calibrate gestures and tune sensitivity from the dashboard
- Add custom gesture mapping
- Support more platforms
- Explore voice commands

## 🛠️ Technologies I used

- Python
- MediaPipe
- OpenCV
- PyAutoGUI
- HTML, CSS, and JavaScript

---

**Created by Henston Dsouza**  
[GitHub](https://github.com/henston-dza) · [LinkedIn demo](https://www.linkedin.com/posts/henston-melroy-dsouza_python-computervision-mediapipe-ugcPost-7478811191033643008-d7gI/?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEvlPaUBVB_3EiuU4wV9mAZEFjrA2scFFgQ)
