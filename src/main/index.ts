import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
// import { OpenAiClient } from './openai'
import { exec } from 'child_process'

import dotenv from 'dotenv'
dotenv.config()

// const openAiClient = new OpenAiClient(process.env.OPENAI_API_KEY as string)

const checkDockerInstalled = async () => {
  return new Promise((resolve, _reject) => {
    exec('docker -v', (error, stdout, _stderr) => {
      if (error) {
        // docker not found or error
        resolve({ error, docker: null })
      } else {
        // docker found
        resolve({ error: false, docker: stdout })
      }
    })
  })
}

const checkDockerStatus = async () => {
  return new Promise((resolve, _reject) => {
    exec('docker ps', (error, stdout, _stderr) => {
      if (error) {
        resolve({ stdout, running: false })
        // Docker is not installed or there was an error running the command
      } else {
        resolve({ stdout, running: true })
        // Docker is installed
      }
    })
  })
}

const startDocker = async () => {
  return new Promise((resolve, _reject) => {
    exec('open --background -a Docker', (error, stdout, _stderr) => {
      if (error) {
        console.log('docker start error')
        resolve({ error: error, docker: false, stdout: stdout })
        // Docker is not installed or there was an error running the command
      } else {
        console.log('docker starting')
        resolve({ error: error, docker: true, stdout: stdout })
        // Docker is installed
      }
    })
  })
}

const createWindow = (): void => {
  // Create the browser window.

  let mainWindow: BrowserWindow | null = new BrowserWindow({
    // alwaysOnTop: true,
    center: true,
    width: 900,
    height: 670,
    show: false,
    frame: true,
    transparent: false,
    opacity: 1,
    resizable: false,
    backgroundColor: '#FFF',
    autoHideMenuBar: true,
    modal: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('closed', () => (mainWindow = null))
  // mainWindow.on('blur', () => mainWindow?.close())
  mainWindow.on('ready-to-show', () => mainWindow?.show())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.center()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // ipcMain.handle('completion:prompt', async (): Promise<any> => {
  //   console.log('Prompted')
  //   try {
  //     const completion = await openAiClient.createChatCompletion('What is your prime directive?')
  //     return completion
  //   } catch (error) {
  //     console.error(error)
  //   }
  // })

  ipcMain.handle('docker:check', async (): Promise<any> => {
    return checkDockerInstalled()
  })

  ipcMain.handle('docker:checkrunning', async (): Promise<any> => {
    return checkDockerStatus()
  })

  ipcMain.handle('docker:start', async (): Promise<any> => {
    return startDocker()
  })

  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// const quitDocker = async () => {
//   return new Promise((resolve, _reject) => {
//     exec(`osascript -e 'quit app "Docker"'`, (error, _stdout, _stderr) => {
//       if (error) {
//         resolve('docker stop error')
//       } else {
//         resolve('docker stopping')
//       }
//     })
//   })
// }

app.on('window-all-closed', async () => {
  app.quit()
  // if (process.platform !== 'darwin') {app.quit()}
})
