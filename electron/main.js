import { app, BrowserWindow, protocol } from "electron"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

if (app.isPackaged) {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: "app",
      privileges: {
        secure: true,
        standard: true,
        supportFetchAPI: true,
      },
    },
  ])
}

const createMainWindow = async () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    backgroundColor: "#000000",
    show: false,
    webPreferences: {
      contextIsolation: true,
    },
  })

  const devServerUrl = process.env.VITE_DEV_SERVER_URL ?? "http://localhost:5173"
  const packagedIndexUrl = "app://dist/index.html"
  const targetUrl = app.isPackaged ? packagedIndexUrl : devServerUrl

  await mainWindow.loadURL(targetUrl)

  mainWindow.once("ready-to-show", () => {
    mainWindow.show()
  })

  if (!app.isPackaged && process.env.ELECTRON_OPEN_DEVTOOLS !== "false") {
    mainWindow.webContents.openDevTools({ mode: "detach" })
  }

  mainWindow.webContents.on("did-fail-load", (_event, code, desc) => {
    console.error("Renderer failed to load", { code, desc, targetUrl })
  })

  mainWindow.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    console.log("[renderer]", { level, message, line, sourceId })
  })

  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    console.error("Renderer process gone", details)
  })

  return mainWindow
}

app.whenReady().then(() => {
  if (app.isPackaged) {
    protocol.registerFileProtocol("app", (request, callback) => {
      const url = new URL(request.url)
      const relativePath = `${url.host}${url.pathname}`
      const decodedPath = decodeURIComponent(relativePath)
      const resourcePath = join(app.getAppPath(), decodedPath)
      callback(resourcePath)
    })
  }

  createMainWindow().catch((error) => {
    console.error("Failed to create main window", error)
    app.quit()
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow().catch((error) => {
      console.error("Failed to recreate main window", error)
      app.quit()
    })
  }
})
