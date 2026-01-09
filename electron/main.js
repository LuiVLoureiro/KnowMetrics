const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV !== 'production';

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    backgroundColor: '#1F252F',
    show: false
  });

  // Carregar a URL do React dev server ou o build
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  win.loadURL(startUrl);

  win.once('ready-to-show', () => {
    win.show();
  });

  if (isDev) {
    win.webContents.openDevTools();
  }
}

// Criar pastas necessárias
function ensureDirectories() {
  const userDataPath = app.getPath('userData');
  const questoesPath = path.join(userDataPath, 'questoes');
  const estatisticasPath = path.join(userDataPath, 'estatisticas');
  const sonsPath = path.join(userDataPath, 'sons');

  [questoesPath, estatisticasPath, sonsPath].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  return { questoesPath, estatisticasPath, sonsPath, userDataPath };
}

app.whenReady().then(() => {
  ensureDirectories();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers para comunicação com React

// Obter caminhos do app
ipcMain.handle('get-paths', () => {
  return ensureDirectories();
});

// Listar arquivos de uma pasta
ipcMain.handle('list-files', async (event, { directory, extension }) => {
  try {
    const paths = ensureDirectories();
    const dirPath = paths[directory] || directory;
    
    if (!fs.existsSync(dirPath)) {
      return [];
    }
    
    const files = fs.readdirSync(dirPath)
      .filter(file => file.endsWith(extension));
    return files;
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
});

// Ler arquivo
ipcMain.handle('read-file', async (event, { directory, filename }) => {
  try {
    const paths = ensureDirectories();
    const dirPath = paths[directory] || directory;
    const filePath = path.join(dirPath, filename);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error('Error reading file:', error);
    return null;
  }
});

// Escrever arquivo
ipcMain.handle('write-file', async (event, { directory, filename, content }) => {
  try {
    const paths = ensureDirectories();
    const dirPath = paths[directory] || directory;
    const filePath = path.join(dirPath, filename);
    
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing file:', error);
    return false;
  }
});

// Verificar se arquivo existe
ipcMain.handle('file-exists', async (event, { directory, filename }) => {
  try {
    const paths = ensureDirectories();
    const dirPath = paths[directory] || directory;
    const filePath = path.join(dirPath, filename);
    
    return fs.existsSync(filePath);
  } catch (error) {
    console.error('Error checking file:', error);
    return false;
  }
});

// Anexar conteúdo a arquivo
ipcMain.handle('append-file', async (event, { directory, filename, content }) => {
  try {
    const paths = ensureDirectories();
    const dirPath = paths[directory] || directory;
    const filePath = path.join(dirPath, filename);
    
    fs.appendFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error('Error appending to file:', error);
    return false;
  }
});

// Mostrar diálogo
ipcMain.handle('show-dialog', async (event, options) => {
  const result = await dialog.showMessageBox(options);
  return result;
});
