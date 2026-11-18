<p align="center">
  <img src="assets/img.png" alt="Gesture Earth Controller Banner">
</p>

# 🌍 Gesture Earth Controller

Control **Google Earth** using intuitive hand gestures powered by **MediaPipe**, **OpenCV**, and **PyAutoGUI**.

Gesture Earth Controller is a computer vision project that enables touch-free navigation of Google Earth using a webcam. Users can move the cursor, click, drag, zoom, rotate, and tilt the Earth with natural hand gestures.

---

## ✨ Features

- 🖱️ Cursor Movement
- 👆 Click Detection
- 🤏 Drag & Drop
- 🔍 Zoom In / Zoom Out
- 🌎 Earth Rotation
- 🎥 Earth Tilt
- 📊 Live Dashboard
- 🧭 Local Web Control Center
- ⚡ Smooth Cursor Tracking
- 🎯 Real-time Hand Tracking using MediaPipe
- 🌐 Opens Google Earth automatically when the controller starts

---

## 🖐️ Supported Gestures

| Gesture | Action |
|----------|--------|
| ☝️ Index Finger | Cursor Movement |
| 🤏 Thumb + Index Pinch | Click |
| 🤏 Hold Pinch | Drag |
| ✌️ Index + Middle | Zoom |
| 🖐️ Open Palm | Rotate Earth |
| 🤏🤏 Double Pinch + Drag | Tilt Earth |

---

## 📂 Project Structure

```text
gesture-earth/
│
├── .gitignore
├── LICENSE
├── README.md
├── requirements.txt
│
├── main.py
├── server.py
├── runtime.py
├── run_dashboard.bat
├── web/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── config.py
├── gestures.py
├── utils.py
├── cursor.py
├── click_drag.py
├── zoom.py
└── rotate.py
```

---

## ⚙️ Requirements

- Windows 10 / Windows 11
- Python **3.12.3** (Tested)
- Webcam

---

## 🚀 Installation

Clone the repository

```bash
git clone https://github.com/henston-dza/gesture-earth.git
```

Move into the project

```bash
cd gesture-earth
```

Create a virtual environment

```bash
python -m venv venv
```

Activate it

### Windows

```bash
venv\Scripts\activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

## 🖥️ Web Dashboard

The project includes a local HTML, CSS, and JavaScript dashboard for viewing project details and controlling the gesture controller. It displays the live camera feed, tracking state, current gesture, frame rate, session time, and recent activity. The dashboard can start or stop tracking, open Google Earth, and toggle the camera overlay and hand landmarks.

Start the dashboard from this folder:

```bash
python server.py
```

The local dashboard opens at `http://127.0.0.1:8765`. On Windows, you can also double-click `run_dashboard.bat`. Keep the terminal window open while using it. Click **Start controller** in the dashboard to open the webcam and begin tracking. The first start may prompt you to allow Python to use the camera.

The web server listens on the local computer only. Gesture actions use PyAutoGUI to move and click the system cursor, so keep Google Earth open and focused while navigating. **Stop controller** releases any held mouse button and closes the camera preview.

The original OpenCV application is still available without the web interface:

```bash
python main.py
```

This opens the controller directly; use `Q` to quit, `H` to toggle its dashboard, and `D` to toggle its landmarks.

The Google Earth URL and startup wait are configured in `config.py`.

---

## ⌨️ Keyboard Shortcuts

| Key | Function |
|-----|----------|
| H | Toggle Dashboard |
| D | Toggle Hand Landmarks |
| Q | Quit Application |


---

## 🎥 Demo

Watch the demo on **[LinkedIn](https://www.linkedin.com/posts/henston-melroy-dsouza_python-computervision-mediapipe-ugcPost-7478811191033643008-d7gI/?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEvlPaUBVB_3EiuU4wV9mAZEFjrA2scFFgQ)**.

---

## ⚠️ Known Limitations

- The OpenCV preview window temporarily pauses while it is being moved. This is a limitation of OpenCV's HighGUI window system.
- For best performance, keep the camera preview window focused while using keyboard shortcuts.
- Tested on Windows 11 with Python 3.12.3.

---

## 🔮 Future Improvements

- Multi-hand support
- Custom gesture mapping
- Gesture calibration
- Cross-platform support
- GUI settings panel
- Gesture sensitivity adjustment
- Voice command integration

---

## 🛠️ Technologies Used

- Python
- OpenCV
- MediaPipe
- PyAutoGUI

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Henston Dsouza**

GitHub: https://github.com/henston-dza
