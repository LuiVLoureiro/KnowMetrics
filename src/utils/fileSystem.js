// Utilitários para comunicação com o Electron
const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

// Verificar se estamos no Electron
export const isElectron = () => {
  return window.require !== undefined;
};

// Obter caminhos do app
export const getPaths = async () => {
  if (!isElectron()) return null;
  return await ipcRenderer.invoke('get-paths');
};

// Listar arquivos
export const listFiles = async (directory, extension) => {
  if (!isElectron()) {
    // Fallback para desenvolvimento web (usar localStorage)
    const stored = localStorage.getItem(`files_${directory}`);
    return stored ? JSON.parse(stored) : [];
  }
  return await ipcRenderer.invoke('list-files', { directory, extension });
};

// Ler arquivo
export const readFile = async (directory, filename) => {
  if (!isElectron()) {
    return localStorage.getItem(`${directory}_${filename}`);
  }
  return await ipcRenderer.invoke('read-file', { directory, filename });
};

// Escrever arquivo
export const writeFile = async (directory, filename, content) => {
  if (!isElectron()) {
    localStorage.setItem(`${directory}_${filename}`, content);
    // Atualizar lista de arquivos
    const files = JSON.parse(localStorage.getItem(`files_${directory}`) || '[]');
    if (!files.includes(filename)) {
      files.push(filename);
      localStorage.setItem(`files_${directory}`, JSON.stringify(files));
    }
    return true;
  }
  return await ipcRenderer.invoke('write-file', { directory, filename, content });
};

// Verificar se arquivo existe
export const fileExists = async (directory, filename) => {
  if (!isElectron()) {
    return localStorage.getItem(`${directory}_${filename}`) !== null;
  }
  return await ipcRenderer.invoke('file-exists', { directory, filename });
};

// Anexar conteúdo a arquivo
export const appendFile = async (directory, filename, content) => {
  if (!isElectron()) {
    const existing = localStorage.getItem(`${directory}_${filename}`) || '';
    localStorage.setItem(`${directory}_${filename}`, existing + content);
    return true;
  }
  return await ipcRenderer.invoke('append-file', { directory, filename, content });
};

// Mostrar diálogo
export const showDialog = async (options) => {
  if (!isElectron()) {
    alert(options.message);
    return { response: 0 };
  }
  return await ipcRenderer.invoke('show-dialog', options);
};
