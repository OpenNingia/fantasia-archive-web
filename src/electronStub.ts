// Stub for electron APIs — used in web/SPA mode.
// Electron-specific features (native file dialogs, shell) are replaced by web alternatives in Phase 4.

export const shell = {
  openExternal: (url: string) => { void window.open(url, "_blank") }
}

const noop = () => undefined
const noopAsync = async () => undefined

export const remote = {
  app: {
    getVersion: () => "web",
    getPath: () => "",
    getName: () => "Fantasia Archive"
  },
  dialog: {
    showSaveDialog: noopAsync,
    showOpenDialog: noopAsync,
    showMessageBox: noopAsync
  },
  getCurrentWindow: () => ({
    minimize: noop,
    maximize: noop,
    unmaximize: noop,
    close: noop,
    isMaximized: () => false,
    setTitle: noop
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  require: (_: string): any => ({})
}
