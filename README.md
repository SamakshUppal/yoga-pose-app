# Yoga Pose App (Combined Repo)

This repo contains **frontend** (MediaPipe Pose Landmarker in the browser) and **backend** (Flask + SQLite + Socket.IO) for a full demo.

## Folder Structure
```
yoga-pose-app/
├── backend/   # Flask server: REST + WebSockets + DB viewer
└── frontend/  # Browser app: webcam + MediaPipe + live send/listen
```

## Demo Steps (end-to-end)
1) **Start backend**
```
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
- Check health: http://localhost:5000/health
- (Optional) Admin viewer: http://localhost:5000/admin

2) **Start frontend**
```
cd ../frontend
python -m http.server 8000
```
- Open http://localhost:8000
- Set Backend URL to `http://localhost:5000`
- Click **Initialize** and allow camera

3) **What you should see**
- Webcam preview + overlay of landmarks
- "Last POST" timestamp updating ~every 600ms
- Live updates appearing in the right panel (from WebSocket)
- Data accumulating in DB; browse via `/admin`

## Notes
- Frontend extracts landmarks on-device → **no GPU cost on backend**
- Backend stores results + broadcasts (throttled) → **smooth real-time UX**
- For production, add auth and move DB to Postgres

## Contributing (PR workflow)
- Create a branch (`backend-dev`, `frontend-dev`)
- Commit with your own GitHub ID
- Open a Pull Request to `main`
- Teammate reviews and merges
