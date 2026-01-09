import React, { useState, useEffect } from 'react';
import { listFiles, readFile, writeFile } from '../utils/fileSystem';
import { useApp } from '../contexts/AppContext';
import { 
  PlusCircle, 
  Trash2, 
  Eye, 
  Save,
  Plus,
  FileText,
  CheckCircle
} from 'lucide-react';

const CreateQuestion = () => {
  const { showNotification } = useApp();
  
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  
  const [tema, setTema] = useState('');
  const [pergunta, setPergunta] = useState('');
  const [alternativas, setAlternativas] = useState(['', '']);
  const [respostaCorreta, setRespostaCorreta] = useState('');
  
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carregar lista de arquivos
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const fileList = await listFiles('questoesPath', '.json');
        setFiles(fileList);
      } catch (error) {
        console.error('Erro ao carregar arquivos:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFiles();
  }, []);

  // Adicionar alternativa
  const addAlternativa = () => {
    if (alternativas.length < 6) {
      setAlternativas([...alternativas, '']);
    }
  };

  // Remover alternativa
  const removeAlternativa = (index) => {
    if (alternativas.length > 2) {
      const newAlternativas = alternativas.filter((_, i) => i !== index);
      setAlternativas(newAlternativas);
      
      // Atualizar resposta correta se necessário
      if (respostaCorreta === alternativas[index]) {
        setRespostaCorreta('');
      }
    }
  };

  // Atualizar alternativa
  const updateAlternativa = (index, value) => {
    const newAlternativas = [...alternativas];
    newAlternativas[index] = value;
    setAlternativas(newAlternativas);
    
    // Atualizar resposta correta se foi alterada
    if (respostaCorreta === alternativas[index]) {
      setRespostaCorreta(value);
    }
  };

  // Validar formulário
  const validateForm = () => {
    if (!selectedFile && !newFileName) {
      showNotification('Selecione ou crie um arquivo de questões', 'warning');
      return false;
    }
    
    if (!tema.trim()) {
      showNotification('Preencha o tema da questão', 'warning');
      return false;
    }
    
    if (!pergunta.trim()) {
      showNotification('Preencha a pergunta', 'warning');
      return false;
    }
    
    const validAlternativas = alternativas.filter(a => a.trim());
    if (validAlternativas.length < 2) {
      showNotification('Adicione pelo menos 2 alternativas', 'warning');
      return false;
    }
    
    if (!respostaCorreta) {
      showNotification('Selecione a resposta correta', 'warning');
      return false;
    }
    
    if (!validAlternativas.includes(respostaCorreta)) {
      showNotification('A resposta correta deve ser uma das alternativas', 'warning');
      return false;
    }
    
    return true;
  };

  // Salvar questão
  const saveQuestion = async (addAnother = false) => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      let filename = selectedFile;
      
      // Criar novo arquivo se necessário
      if (showNewFileInput && newFileName) {
        filename = newFileName.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '') + '.json';
      }
      
      if (!filename) {
        showNotification('Nome de arquivo inválido', 'error');
        return;
      }
      
      // Carregar questões existentes ou criar array vazio
      let existingQuestions = [];
      const content = await readFile('questoesPath', filename);
      
      if (content) {
        existingQuestions = JSON.parse(content);
      }
      
      // Criar nova questão
      const newQuestion = {
        id: existingQuestions.length ? existingQuestions[existingQuestions.length - 1].id + 1 : 1,
        tema: tema.trim(),
        pergunta: pergunta.trim(),
        alternativas: alternativas.filter(a => a.trim()),
        resposta: respostaCorreta
      };
      
      existingQuestions.push(newQuestion);
      
      // Salvar
      await writeFile('questoesPath', filename, JSON.stringify(existingQuestions, null, 2));
      
      showNotification('Questão salva com sucesso!', 'success');
      
      // Atualizar lista de arquivos se necessário
      if (!files.includes(filename)) {
        setFiles([...files, filename]);
        setSelectedFile(filename);
        setShowNewFileInput(false);
        setNewFileName('');
      }
      
      if (addAnother) {
        // Limpar apenas pergunta, alternativas e resposta
        setPergunta('');
        setAlternativas(['', '']);
        setRespostaCorreta('');
        setShowPreview(false);
      } else {
        // Limpar tudo
        setTema('');
        setPergunta('');
        setAlternativas(['', '']);
        setRespostaCorreta('');
        setShowPreview(false);
      }
    } catch (error) {
      console.error('Erro ao salvar questão:', error);
      showNotification('Erro ao salvar questão', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Preview da questão
  const renderPreview = () => {
    if (!showPreview) return null;
    
    const validAlternativas = alternativas.filter(a => a.trim());
    
    return (
      <div className="card mt-6 animate-fade-in">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          Pré-visualização
        </h3>
        
        <div className="bg-background rounded-xl p-6">
          <div className="text-primary text-sm font-medium mb-2">{tema || 'Tema'}</div>
          <div className="bg-primary/20 rounded-xl p-4 mb-4">
            <p className="text-white">{pergunta || 'Pergunta...'}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {validAlternativas.map((alt, index) => (
              <div
                key={index}
                className={`
                  p-3 rounded-xl text-sm
                  ${alt === respostaCorreta 
                    ? 'bg-success/20 text-success border border-success/30' 
                    : 'bg-background-lighter text-white/70'}
                `}
              >
                {alt === respostaCorreta && (
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                )}
                {alt}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading && files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-white/50">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
          <PlusCircle className="w-8 h-8 text-primary" />
          Criar Questão
        </h2>
        <p className="text-white/60 mt-2">Adicione novas questões ao seu banco</p>
      </div>

      <div className="card">
        {/* Seleção de arquivo */}
        <div className="mb-6">
          <label className="block text-white/70 text-sm mb-2">
            Arquivo de Questões
          </label>
          
          {!showNewFileInput ? (
            <div className="flex gap-3">
              <select
                value={selectedFile}
                onChange={(e) => {
                  if (e.target.value === '__new__') {
                    setShowNewFileInput(true);
                    setSelectedFile('');
                  } else {
                    setSelectedFile(e.target.value);
                  }
                }}
                className="select-field flex-1"
              >
                <option value="">Selecione um arquivo</option>
                {files.map(file => (
                  <option key={file} value={file}>
                    {file.replace('.json', '')}
                  </option>
                ))}
                <option value="__new__">+ Criar novo arquivo</option>
              </select>
            </div>
          ) : (
            <div className="flex gap-3">
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="Nome do novo arquivo"
                className="input-field flex-1"
              />
              <button
                onClick={() => {
                  setShowNewFileInput(false);
                  setNewFileName('');
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Tema */}
        <div className="mb-6">
          <label className="block text-white/70 text-sm mb-2">Tema</label>
          <input
            type="text"
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            placeholder="Ex: Matemática, História, etc."
            className="input-field"
          />
        </div>

        {/* Pergunta */}
        <div className="mb-6">
          <label className="block text-white/70 text-sm mb-2">Pergunta</label>
          <textarea
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            placeholder="Digite a pergunta..."
            rows={4}
            className="input-field resize-none"
          />
        </div>

        {/* Alternativas */}
        <div className="mb-6">
          <label className="block text-white/70 text-sm mb-2">Alternativas</label>
          <div className="space-y-3">
            {alternativas.map((alt, index) => (
              <div key={index} className="flex gap-3 items-center">
                <input
                  type="text"
                  value={alt}
                  onChange={(e) => updateAlternativa(index, e.target.value)}
                  placeholder={`Alternativa ${index + 1}`}
                  className="input-field flex-1"
                />
                {alternativas.length > 2 && (
                  <button
                    onClick={() => removeAlternativa(index)}
                    className="p-3 bg-error/20 hover:bg-error/40 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-error" />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {alternativas.length < 6 && (
            <button
              onClick={addAlternativa}
              className="mt-3 flex items-center gap-2 text-primary hover:text-primary-light transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar alternativa
            </button>
          )}
        </div>

        {/* Resposta Correta */}
        <div className="mb-6">
          <label className="block text-white/70 text-sm mb-2">Resposta Correta</label>
          <select
            value={respostaCorreta}
            onChange={(e) => setRespostaCorreta(e.target.value)}
            className="select-field"
          >
            <option value="">Selecione a resposta correta</option>
            {alternativas.filter(a => a.trim()).map((alt, index) => (
              <option key={index} value={alt}>{alt}</option>
            ))}
          </select>
        </div>

        {/* Botões */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn-secondary flex items-center gap-2"
          >
            <Eye className="w-5 h-5" />
            {showPreview ? 'Ocultar' : 'Pré-visualizar'}
          </button>
          
          <button
            onClick={() => saveQuestion(true)}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Salvar e Adicionar Outra
          </button>
          
          <button
            onClick={() => saveQuestion(false)}
            disabled={loading}
            className="btn-success flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            Salvar e Sair
          </button>
        </div>
      </div>

      {/* Preview */}
      {renderPreview()}

      {/* Dica de atalho */}
      <div className="mt-6 text-center text-white/40 text-sm">
        Dica: Use <kbd className="px-2 py-1 bg-background-light rounded">Ctrl + Enter</kbd> para salvar rapidamente
      </div>
    </div>
  );
};

export default CreateQuestion;
