import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Send message to main process
  test: () => ipcRenderer.invoke('dialog:test'),

  prompt: () => ipcRenderer.invoke('completion:prompt'),
  checkDocker: () => ipcRenderer.invoke('docker:check'),
  checkDockerIsRunning: () => ipcRenderer.invoke('docker:checkrunning'),
  startDocker: () => ipcRenderer.invoke('docker:start')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
