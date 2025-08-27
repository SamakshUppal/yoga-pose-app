import { PoseLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.js";

const qs = (sel) => document.querySelector(sel);
const backendInput = qs('#backendUrl');
const usernameInput = qs('#username');
const initBtn = qs('#initBtn');
const initStatus = qs('#initStatus');
const video = qs('#video');
const canvas = qs('#output');
const ctx = canvas.getContext('2d');
const fpsEl = qs('#fps');
const lastPostEl = qs('#lastPost');
const wsStatus = qs('#wsStatus');
const wsLog = qs('#wsLog');

let userId = null;
let landmarker = null;
let lastSendMs = 0;
let frameCount = 0;
let lastFpsTime = performance.now();
let socket = null;
let sessionName = 'live-' + Date.now();

const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";

async function registerOrGetUser(backendUrl, username) {
  const saved = localStorage.getItem('yoga_user');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.backendUrl === backendUrl && parsed.username === username && parsed.userId) {
        return parsed.userId;
      }
    } catch {}
  }
  const res = await fetch(backendUrl + "/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username })
  });
  const data = await res.json();
  let uid = data.user_id || data.userId;
  if (!uid && data.message === 'exists') uid = data.user_id;
  userId = uid;
  localStorage.setItem('yoga_user', JSON.stringify({ backendUrl, username, userId }));
  return userId;
}

async function initSocket(backendUrl) {
  socket = io(backendUrl, { transports: ["websocket"] });
  wsStatus.textContent = "connecting...";
  socket.on("connect", () => { wsStatus.textContent = "connected"; wsStatus.className = "ok"; });
  socket.on("disconnect", () => { wsStatus.textContent = "disconnected"; wsStatus.className = "err"; });
  socket.on("landmark_update", (payload) => {
    const line = `[${new Date().toLocaleTimeString()}] id=${payload.id} user=${payload.user_id} name=${payload.name}`;
    wsLog.textContent = line + "\n" + wsLog.textContent;
  });
}

async function initCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
  video.srcObject = stream;
  await video.play();
  canvas.width = video.videoWidth / 2;
  canvas.height = video.videoHeight / 2;
}

async function initLandmarker() {
  const resolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );
  landmarker = await PoseLandmarker.createFromOptions(resolver, {
    baseOptions: { modelAssetPath: MODEL_URL },
    runningMode: "VIDEO",
    numPoses: 1
  });
}

function drawResults(results) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
  const utils = new DrawingUtils(ctx);
  if (results.landmarks && results.landmarks[0]) {
    utils.drawLandmarks(results.landmarks[0], { radius: 2 });
    utils.drawConnectors(results.landmarks[0], PoseLandmarker.POSE_CONNECTIONS);
  }
  ctx.restore();
}

async function sendLandmarks(backendUrl, results) {
  const now = performance.now();
  if (now - lastSendMs < 600) return; // throttle client->server
  lastSendMs = now;

  const payload = {
    user_id: userId,
    name: sessionName,
    landmarks: results.landmarks ? results.landmarks[0] : null
  };
  await fetch(backendUrl + "/api/landmarks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  lastPostEl.textContent = new Date().toLocaleTimeString();
}

async function loop(backendUrl) {
  if (!landmarker) return;
  const start = performance.now();
  const results = await landmarker.detectForVideo(video, start);
  drawResults(results);
  await sendLandmarks(backendUrl, results);

  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 1000) {
    fpsEl.textContent = frameCount.toString();
    frameCount = 0;
    lastFpsTime = now;
  }
  requestAnimationFrame(() => loop(backendUrl));
}

document.querySelector('#initBtn').addEventListener('click', async () => {
  try {
    document.querySelector('#initStatus').textContent = "initializing...";
    const backendUrl = backendInput.value.trim();
    const username = usernameInput.value.trim() || ("demo-" + Date.now());

    userId = await registerOrGetUser(backendUrl, username);
    await initSocket(backendUrl);
    await initCamera();
    await initLandmarker();

    document.querySelector('#initStatus').textContent = "ready";
    document.querySelector('#initStatus').className = "pill ok";
    loop(backendUrl);
  } catch (e) {
    console.error(e);
    document.querySelector('#initStatus').textContent = "error";
    document.querySelector('#initStatus').className = "pill err";
  }
});
