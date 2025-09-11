
# SyncStream Pro

Synchronized watch‑together app with real‑time chat, Electron desktop UI, and a built‑in HTTP streaming server for local files. Designed for self‑hosting with router port‑forwarding (no third‑party tunnels).

## Features

- Synchronized playback with Socket.IO
- Real‑time chat with typing indicators and join/leave system messages
- Local file streaming over HTTP with range requests
- Load by file path (Electron) or direct/remote URL
- Media manager: clear current media, history, quick reload
- Internet Speed Test (download/upload/ping/jitter) with recommendations
- Secure-by-default Electron setup: contextIsolation, no nodeIntegration, strict CSP
- Optional HTTPS (self‑signed) for remote access

## Requirements

- Node.js 18+
- Windows 10/11 for the provided scripts (Linux/macOS supported via npm)

## Install

```bash
npm install
```

## Run (Electron desktop)

```bash
npm start
```

If you prefer server only (for browser access on LAN):

```bash
node app.js
```

## Access

- Local: `http://localhost:5000`
- LAN: `http://<your-local-ip>:5000`
- Internet: `http://<your-public-ip>:5000` (requires port forwarding)

## Port Forwarding (internet access)

1. Forward TCP port 5000 on your router to your PC’s local IP.
2. Share your public URL with friends: `http://<public-ip>:5000/?join=<ROOMID>` or protocol link `syncstream://<public-ip>/join/<ROOMID>` (Electron app users).
3. Consider Dynamic DNS if your IP changes frequently.

Pros: full control, no third‑party dependency.  
Cons: exposes a port, depends on your ISP/router, requires firewall allow‑rule.

## Security

- Electron hardened: `contextIsolation: true`, `nodeIntegration: false`, `webSecurity: true`, preload bridge only
- Strict Content‑Security‑Policy in `src/renderer/index.html`
- Express security headers, CORS and basic rate limiting via `SecurityManager`
- JWT support for sockets (hook present), SHA‑256 hashing utilities, AES‑256‑GCM helpers

## Project Structure

```
sync-watch/
├─ app.js
├─ src/
│  ├─ main.js                # Electron main process
│  ├─ preload.js             # Secure IPC bridge
│  ├─ server/
│  │  ├─ RoomManager.js
│  │  ├─ SocketHandler.js
│  │  ├─ StreamingServer.js
│  │  ├─ SecurityManager.js
│  │  └─ Routes.js
│  └─ renderer/
│     ├─ index.html
│     ├─ css/main.css
│     └─ js/
│        ├─ app.js
│        └─ modules/
│           ├─ ChatManager.js
│           ├─ NetworkMonitor.js
│           ├─ SocketManager.js
│           ├─ SpeedTest.js
│           ├─ StateManager.js
│           ├─ UIManager.js
│           └─ VideoManager.js
└─ python/
   ├─ server.py
   └─ network_monitor.py
```

## Usage

1. Start the app (`npm start`).
2. Create a room (your machine becomes the host server).
3. Load media:
   - Electron: choose a local video file (it streams via `/stream/<roomId>/video`).
   - URL: paste a direct media URL.
4. Share the room ID or the generated URL.

Admin can pause/play/seek for everyone, clear media, and manage history.

## Git

Initialize and push to your repo:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<username>/<repo>.git
git branch -M master
git push -u origin master
```

## License

This project is provided as‑is. Review third‑party licenses for included libraries.
