const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  openFile: async () => {
    try {
      return await ipcRenderer.invoke('dialog:openFile')
    } catch (error) {
      console.error('Error in openFile:', error)
      throw error
    }
  },
  selectDirectory: async () => {
    try {
      const result = await ipcRenderer.invoke('dialog:selectDirectory')
      console.log('selectDirectory result:', result)
      return result
    } catch (error) {
      console.error('Error in selectDirectory:', error)
      throw error
    }
  },
  saveImage: async (data) => {
    try {
      console.log('Saving image with data:', data)
      const result = await ipcRenderer.invoke('file:saveImage', data)
      console.log('Save result:', result)
      return result
    } catch (error) {
      console.error('Error in saveImage:', error)
      throw error
    }
  },
  saveFile: async (suggestedName) => {
    const result = await ipcRenderer.invoke('dialog:saveFile', suggestedName)
    return result
  }
}) 