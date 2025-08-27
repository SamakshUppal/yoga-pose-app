# Frontend (MediaPipe + Demo)

- Extracts pose landmarks **in the browser** using MediaPipe Pose Landmarker
- Sends landmarks to backend via HTTP POST (throttled)
- Listens to live updates via Socket.IO

## Run
```bash
cd frontend
python -m http.server 8000
# open http://localhost:8000 in your browser
```
Set `Backend URL` to `http://localhost:5000`, click **Initialize**, allow camera access.
