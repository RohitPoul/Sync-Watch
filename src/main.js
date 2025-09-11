const { app, BrowserWindow, ipcMain, dialog, protocol } = require("electron");
const path = require("path");
const { startServer } = require("../app.js");

let mainWindow;
let serverInstance = null;
const PROTOCOL_NAME = "syncstream";

// Application state with better state management
const appState = {
  mode: null, // 'host' or 'client'
  isServerRunning: false,
  isStartingServer: false,
  serverInfo: null,
  qualitySettings: null,
  streamingConfig: null,
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false, // Security: Disable node integration
      contextIsolation: true, // Security: Enable context isolation
      webSecurity: true, // Security: Enable web security
      preload: path.join(__dirname, 'preload.js'), // Use preload script for secure IPC
      // Additional security settings
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      enableRemoteModule: false,
      // CSP will be set via meta tag in HTML
    },
    frame: true,
    titleBarStyle: "default",
    backgroundColor: "#0f172a",
    minWidth: 1000,
    minHeight: 600,
    show: false,
    title: "SyncStream Pro - Enhanced Quality",
    icon: path.join(__dirname, "../assets/icon.png"),
    minimizable: true,
    maximizable: true,
    resizable: true,
    closable: true,
  });

  // Load the renderer
  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    console.log("SyncStream Enhanced window ready");
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
    stopServer();
  });

  // Handle protocol URLs
  handleProtocolUrl(process.argv);
}

function handleProtocolUrl(argv) {
  const url = argv.find((arg) => arg.startsWith(`${PROTOCOL_NAME}://`));
  if (url && mainWindow) {
    try {
      // Parse: syncstream://IP:PORT/join/ROOMID
      const urlObj = new URL(url.replace("syncstream:", "http:"));
      const pathParts = urlObj.pathname.split("/");

      if (pathParts[1] === "join" && pathParts[2]) {
        const roomId = pathParts[2];
        const serverHost = urlObj.hostname;
        const serverPort = urlObj.port || 5000;

        console.log(`Auto-join: ${roomId} at ${serverHost}:${serverPort}`);

        mainWindow.webContents.send("auto-join-room", {
          roomId,
          serverHost,
          serverPort,
        });
      }
    } catch (error) {
      console.error("Invalid protocol URL:", error);
    }
  }
}

async function stopServer() {
  if (serverInstance && appState.isServerRunning) {
    try {
      serverInstance.server.close();
      appState.isServerRunning = false;
      appState.isStartingServer = false;
      appState.serverInfo = null;
      appState.qualitySettings = null;
      appState.streamingConfig = null;
      serverInstance = null;
      console.log("Enhanced server stopped");
    } catch (error) {
      console.error("Error stopping server:", error);
    }
  }
}

// Enhanced IPC Handler with Race Condition Prevention
ipcMain.handle("start-host-mode", async (event, options = {}) => {
  try {
    // Check if server is already running or starting
    if (appState.isServerRunning) {
      console.log("Server already running, returning existing info");
      return {
        success: true,
        serverInfo: appState.serverInfo,
        qualitySettings: appState.qualitySettings,
        streamingConfig: appState.streamingConfig,
        alreadyRunning: true,
      };
    }

    // Check if server is currently starting (race condition prevention)
    if (appState.isStartingServer) {
      console.log("Server is already starting, please wait...");
      return {
        success: false,
        error: "Server is already starting. Please wait a moment.",
      };
    }

    // Set starting flag to prevent multiple simultaneous attempts
    appState.isStartingServer = true;
    console.log("Starting enhanced host mode...");
    appState.mode = "host";

    // Store quality settings if provided
    if (options.qualitySettings) {
      appState.qualitySettings = options.qualitySettings;
      appState.streamingConfig = options.streamingConfig;
      console.log("Quality settings applied:", options.qualitySettings);
    }

    // Start server with proper error handling
    serverInstance = await startServer();
    appState.isServerRunning = true;
    appState.isStartingServer = false; // Clear starting flag

    appState.serverInfo = {
      localIp: serverInstance.localIp,
      port: serverInstance.port,
    };

    return {
      success: true,
      serverInfo: appState.serverInfo,
      qualitySettings: appState.qualitySettings,
      streamingConfig: appState.streamingConfig,
    };
  } catch (error) {
    // Reset flags on error
    appState.isStartingServer = false;
    appState.isServerRunning = false;
    console.error("Failed to start enhanced host mode:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// Enhanced client mode handler
ipcMain.handle("start-client-mode", async (event, connectionInfo) => {
  try {
    console.log("Starting enhanced client mode:", connectionInfo);
    appState.mode = "client";
    return {
      success: true,
      connectionInfo,
    };
  } catch (error) {
    console.error("Failed to start enhanced client mode:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// Enhanced stop server handler
ipcMain.handle("stop-server", async () => {
  try {
    await stopServer();
    appState.mode = null;
    return { success: true };
  } catch (error) {
    console.error("Error stopping server:", error);
    return { success: false, error: error.message };
  }
});

// Get current app state
ipcMain.handle("get-app-state", async () => {
  return {
    ...appState,
    serverInstance: !!serverInstance,
  };
});

ipcMain.handle("select-video-file", async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: [
        {
          name: "Video Files",
          extensions: ["mp4", "mkv", "avi", "mov", "webm", "flv", "ogv"],
        },
      ],
    });

    return result;
  } catch (error) {
    console.error("Select video file error:", error);
    throw error;
  }
});

// Window control handlers
ipcMain.handle("window-maximize", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle("window-close", () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle("window-is-maximized", () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// Register protocol
app.setAsDefaultProtocolClient(PROTOCOL_NAME);

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("second-instance", (event, commandLine) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    handleProtocolUrl(commandLine);
  }
});

app.on("open-url", (event, url) => {
  event.preventDefault();
  if (mainWindow) {
    handleProtocolUrl([url]);
  }
});

app.on("window-all-closed", () => {
  stopServer();
  app.quit();
});

app.on("before-quit", () => {
  stopServer();
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  appState.isStartingServer = false; // Reset flag on crash
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  appState.isStartingServer = false; // Reset flag on crash
});
