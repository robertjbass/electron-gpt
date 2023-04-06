import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { OpenAiClient } from './openai'
import { exec } from 'child_process'

import dotenv from 'dotenv'
dotenv.config()

const openAiClient = new OpenAiClient(process.env.OPENAI_API_KEY as string)

// ipcMain.on('channel-name', (event, data) => {
//   console.log('Received data:', data)
//   event.sender.send('channel-name', 'Hello from main!')
// })

const createWindow = (): void => {
  // Create the browser window.

  let mainWindow: BrowserWindow | null = new BrowserWindow({
    alwaysOnTop: true,
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

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // mainWindow.on('blur', () => {
  //   mainWindow?.close()
  // })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

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

  ipcMain.handle('dialog:test', () => {
    return 'Hello from main!'
  })

  ipcMain.handle('completion:prompt', async (): Promise<any> => {
    console.log('Prompted')
    try {
      const completion = await openAiClient.createChatCompletion('What is your prime directive?')
      return completion
    } catch (error) {
      console.error(error)
    }
  })

  ipcMain.handle('docker:check', async (): Promise<any> => {
    const dockerFound: {
      error: any
      docker: null | string
      stdout: string
    } = {
      error: null,
      docker: null,
      stdout: ''
    }
    return new Promise((resolve, _reject) => {
      exec('docker -v', (error, stdout, _stderr) => {
        if (error) {
          // docker not found or error

          resolve({ dockerFound, error, stdout, docker: null })
        } else {
          // docker found
          resolve({ dockerFound, error: false, stdout, docker: stdout })
        }
      })
    })
  })

  ipcMain.handle('docker:checkrunning', async (): Promise<any> => {
    const dockerRunning: {
      error: any
      running: boolean
      stdout: string
    } = {
      error: null,
      running: false,
      stdout: ''
    }
    return new Promise((resolve, _reject) => {
      exec('docker ps', (error, stdout, _stderr) => {
        if (error) {
          resolve({ ...dockerRunning, stdout, running: false })
          // Docker is not installed or there was an error running the command
        } else {
          resolve({ ...dockerRunning, stdout, running: true })
          // Docker is installed
        }
      })
    })
  })

  ipcMain.handle('docker:start', async (): Promise<any> => {
    return new Promise((resolve, _reject) => {
      exec('docker -v', (error, stdout, _stderr) => {
        console.log({ error, stdout, _stderr })
        if (error) {
          resolve({ error: error, docker: false, stdout: stdout })
          // Docker is not installed or there was an error running the command
        } else {
          resolve({ error: error, docker: true, stdout: stdout })
          // Docker is installed
        }
      })
    })
  })

  createWindow()

  // openAiClient
  //   .createChatCompletion('What time is it?')
  //   .then((response) => {
  //     console.log(response)
  //   })
  //   .catch((error) => {
  //     console.error(error)
  //   })

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
  app.quit()
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
