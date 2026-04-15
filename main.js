const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 800,
    minHeight: 600,
    title: 'Base 47',
    backgroundColor: '#1e1f22', // Matches Discord dark mode
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true, // Not recommended for public web, but safe here where we serve local app
      contextIsolation: false,
    }
  });

  // Handle WebRTC constraints & permissions
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true); // Auto-approve microphone required for WebRTC Voice
    } else {
      callback(false);
    }
  });

  // Wait a small delay to ensure the local express server we require is bound and listening
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3001').catch(err => {
      console.log("Loading local server failed.", err);
    });
  }, 1000);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startServer() {
  // SQLite databases cannot be written inside an ASAR zip archive.
  // We must map the database file writing to the user's local AppData folder.
  const userDataPath = app.getPath('userData');
  process.env.DB_PATH = path.join(userDataPath, 'database.sqlite');
  process.env.PORT = '3001';
  
  // Require the express backend directly into the main process!
  // This automatically binds port 3001, handles socket.io, and serves the static Vite frontend.
  try {
    require('./server/server.js');
    console.log("Server initialized on port 3001 natively.");
  } catch (err) {
    console.error("Failed to require local server:", err);
  }
}

app.whenReady().then(() => {
  startServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
