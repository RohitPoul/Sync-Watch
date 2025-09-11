
# SyncStream Pro

Watch together. Stream local files. Chat in real‑time. Self‑host with confidence.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Electron](https://img.shields.io/badge/Electron-Desktop-47848F?logo=electron&logoColor=white)](https://www.electronjs.org)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?logo=socket.io&logoColor=white)](https://socket.io)
[![License](https://img.shields.io/badge/License-Project%20License-blue)](#license)

SyncStream Pro is a watch‑together application with a modern Electron UI and a built‑in HTTP streaming server. Hosts can stream local video files to viewers over LAN or the internet (via router port‑forwarding). Includes real‑time chat, typing indicators, media management, and a speed‑test utility.

## Highlights

- Synchronized playback powered by Socket.IO
- Stream local files using efficient HTTP range requests
- Media Manager: clear current media, history, quick reload
- Chat enhancements: typing indicators, join/leave system messages
- Built‑in speed test (download/upload/ping/jitter) with recommendations
- Security‑hardened Electron: contextIsolation, no nodeIntegration, strict CSP
- Optional HTTPS (self‑signed) for remote access

## Getting Started

### Requirements
- Node.js 18+
- Windows 10/11 (scripts provided). Linux/macOS supported via npm.

### Install
```bash
npm install
```

### Run (Electron desktop)
```bash
npm start
```

### Run server only (for browser clients on LAN)
```bash
node app.js
```

### Access
- Local: `http://localhost:5000`
- LAN: `http://<your-local-ip>:5000`
- Internet: `http://<your-public-ip>:5000` (requires port forwarding)

## Port Forwarding (Internet Access)

1. Forward TCP port 5000 on your router to your PC’s local IP.
2. Share the public URL: `http://<public-ip>:5000/?join=<ROOMID>`
3. Electron users can also use protocol links: `syncstream://<public-ip>/join/<ROOMID>`
4. Consider Dynamic DNS if your IP changes frequently.

Pros: full control, zero third‑party dependency.

Cons: you expose a port; depends on ISP/router; ensure firewall allows inbound 5000/TCP.

## Security

- Electron hardened: `contextIsolation: true`, `nodeIntegration: false`, `webSecurity: true`, preload bridge only
- Strict Content‑Security‑Policy in `src/renderer/index.html`
- Security middleware via `SecurityManager` (Helmet, CORS, basic rate limiting)
- JWT hooks for sockets, SHA‑256 hashing helpers, AES‑256‑GCM utilities

## Architecture

```
Electron (main)
 └─ preload (secure IPC)
    └─ Renderer (UI + modules)
HTTP/Express API  ←→  Socket.IO (realtime)
 └─ StreamingServer (range requests for local files)
 └─ RoomManager / SocketHandler (room, sync, chat)
 └─ SecurityManager (HTTPS, headers, CORS, rate‑limit)
```

## Project Layout

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
2. Create a room — your PC becomes the host server.
3. Load media:
   - Electron: choose a local video file (streams at `/stream/<roomId>/video`).
   - URL: paste a direct media URL.
4. Share the room ID or generated URL with viewers.

Admin controls: play/pause/seek for everyone, clear media, manage history.

## Contributing

Issues and pull requests are welcome. Please follow conventional, descriptive commit messages and open focused PRs.

## License

This project is provided as‑is. Review third‑party licenses for included libraries.
