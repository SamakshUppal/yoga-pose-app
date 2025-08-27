# Backend (Flask)

- REST API for saving/retrieving landmarks
- SQLite persistence
- WebSocket live updates (throttled)
- CORS enabled for demo
- Admin DB viewer at `/admin`

## Run
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
