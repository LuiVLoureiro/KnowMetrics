import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { listFiles, readFile, writeFile, fileExists, appendFile } from '../utils/fileSystem';
import { shuffleArray } from '../utils/mathUtils';
import { useApp } from '../contexts/AppContext';
import { v4 as uuidv4 } from 'uuid';
import { 
  PlayCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Award,
  FileQuestion,
  RotateCcw
} from 'lucide-react';

ChartJS.register(...registerables);

const Quiz = () => {
  const { showNotification } = useApp();
  
  // Estados
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledAlternatives, setShuffledAlternatives] = useState([]);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estatísticas
  const [stats, setStats] = useState({
    acertos: 0,
    erros: 0,
    totalTempo: 0,
    temas: {}
  });
  
  const questionStartTime = useRef(null);
  const sessionId = useRef(null);

  // Carregar lista de arquivos de questões
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

  // Embaralhar alternativas quando a questão muda
  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length) {
      const currentQuestion = questions[currentIndex];
      setShuffledAlternatives(shuffleArray([...currentQuestion.alternativas]));
      questionStartTime.current = Date.now();
      setAnswered(false);
      setSelectedAnswer(null);
    }
  }, [currentIndex, questions]);

  // Iniciar quiz
  const startQuiz = async () => {
    if (!selectedFile) {
      showNotification('Selecione um arquivo de questões', 'warning');
      return;
    }

    try {
      setLoading(true);
      const content = await readFile('questoesPath', selectedFile);
      
      if (!content) {
        showNotification('Arquivo não encontrado', 'error');
        return;
      }

      const parsed = JSON.parse(content);
      const shuffledQuestions = shuffleArray(parsed);
      
      setQuestions(shuffledQuestions);
      setCurrentIndex(0);
      setStats({ acertos: 0, erros: 0, totalTempo: 0, temas: {} });
      sessionId.current = uuidv4();
      setQuizStarted(true);
      setQuizFinished(false);
    } catch (error) {
      console.error('Erro ao iniciar quiz:', error);
      showNotification('Erro ao carregar questões', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Processar resposta
  const handleAnswer = useCallback((answer) => {
    if (answered) return;
    
    setAnswered(true);
    setSelectedAnswer(answer);
    
    const currentQuestion = questions[currentIndex];
    const tempoQuestao = (Date.now() - questionStartTime.current) / 1000;
    const isCorrect = answer === currentQuestion.resposta;
    
    setStats(prev => {
      const newTemas = { ...prev.temas };
      
      if (!newTemas[currentQuestion.tema]) {
        newTemas[currentQuestion.tema] = { acertos: 0, erros: 0, totalTempo: 0 };
      }
      
      if (isCorrect) {
        newTemas[currentQuestion.tema].acertos++;
      } else {
        newTemas[currentQuestion.tema].erros++;
      }
      newTemas[currentQuestion.tema].totalTempo += tempoQuestao;
      
      return {
        acertos: isCorrect ? prev.acertos + 1 : prev.acertos,
        erros: isCorrect ? prev.erros : prev.erros + 1,
        totalTempo: prev.totalTempo + tempoQuestao,
        temas: newTemas
      };
    });

    // Avançar para próxima questão após delay
    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(prev => prev + 1);
      } else {
        finishQuiz();
      }
    }, 1500);
  }, [answered, currentIndex, questions]);

  // Finalizar quiz e salvar estatísticas
  const finishQuiz = async () => {
    setQuizFinished(true);
    
    // Calcular tempo médio por tema
    const temasComTempoMedio = {};
    Object.keys(stats.temas).forEach(tema => {
      const totalQuestoes = stats.temas[tema].acertos + stats.temas[tema].erros;
      temasComTempoMedio[tema] = {
        ...stats.temas[tema],
        tempoMedio: totalQuestoes > 0 ? stats.temas[tema].totalTempo / totalQuestoes : 0
      };
    });

    // Salvar estatísticas
    const totalQuestoes = stats.acertos + stats.erros;
    const tempoMedioGeral = totalQuestoes > 0 ? stats.totalTempo / totalQuestoes : 0;
    const dataHora = new Date();
    const data = dataHora.toLocaleDateString('pt-BR');
    const hora = dataHora.toLocaleTimeString('pt-BR');
    
    const csvFilename = selectedFile.replace('.json', '.csv');
    const novaLinha = `${sessionId.current},${questions.length},${data},${hora},${stats.acertos},${stats.erros},${tempoMedioGeral},"${JSON.stringify(temasComTempoMedio).replace(/"/g, '""')}"\n`;
    
    try {
      const exists = await fileExists('estatisticasPath', csvFilename);
      
      if (!exists) {
        const cabecalho = "ID_Sessao,ID,Data,Hora,Acertos,Erros,Tempo_Medio,Temas\n";
        await writeFile('estatisticasPath', csvFilename, cabecalho + novaLinha);
      } else {
        await appendFile('estatisticasPath', csvFilename, novaLinha);
      }
      
      showNotification('Estatísticas salvas com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao salvar estatísticas:', error);
      showNotification('Erro ao salvar estatísticas', 'error');
    }
  };

  // Reiniciar quiz
  const restartQuiz = () => {
    setQuizStarted(false);
    setQuizFinished(false);
    setQuestions([]);
    setCurrentIndex(0);
    setStats({ acertos: 0, erros: 0, totalTempo: 0, temas: {} });
  };

  // Tela de seleção
  if (!quizStarted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
            <PlayCircle className="w-8 h-8 text-primary" />
            Iniciar Teste
          </h2>
          <p className="text-white/60 mt-2">Selecione um arquivo de questões para começar</p>
        </div>

        <div className="card">
          {loading ? (
            <div className="text-center py-8 text-white/50">Carregando...</div>
          ) : files.length === 0 ? (
            <div className="text-center py-8">
              <FileQuestion className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <p className="text-white/50">Nenhum arquivo de questões encontrado</p>
              <p className="text-white/30 text-sm mt-2">Crie questões primeiro</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label className="block text-white/70 text-sm mb-2">
                  Arquivo de Questões
                </label>
                <select
                  value={selectedFile}
                  onChange={(e) => setSelectedFile(e.target.value)}
                  className="select-field"
                >
                  <option value="">Selecione um arquivo</option>
                  {files.map(file => (
                    <option key={file} value={file}>
                      {file.replace('.json', '')}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={startQuiz}
                disabled={!selectedFile}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <PlayCircle className="w-5 h-5" />
                Iniciar Teste
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Tela de resultados
  if (quizFinished) {
    const notaFinal = ((stats.acertos / questions.length) * 10).toFixed(2);
    const porcentagemAcertos = ((stats.acertos / questions.length) * 100).toFixed(1);
    
    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
            <Award className="w-8 h-8 text-warning" />
            Resultado Final
          </h2>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card-primary text-center">
            <Award className="w-8 h-8 mx-auto mb-2" />
            <p className="text-white/70 text-sm">Nota</p>
            <p className="text-3xl font-bold">{notaFinal}</p>
          </div>
          
          <div className="card text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success" />
            <p className="text-white/70 text-sm">Acertos</p>
            <p className="text-2xl font-bold text-success">{stats.acertos}</p>
            <p className="text-white/50 text-sm">{porcentagemAcertos}%</p>
          </div>
          
          <div className="card text-center">
            <XCircle className="w-8 h-8 mx-auto mb-2 text-error" />
            <p className="text-white/70 text-sm">Erros</p>
            <p className="text-2xl font-bold text-error">{stats.erros}</p>
          </div>
        </div>

        {/* Gráfico pizza */}
        <div className="card mb-8">
          <div className="h-64 flex items-center justify-center">
            <div className="w-64 h-64">
              <Pie
                data={{
                  labels: ['Acertos', 'Erros'],
                  datasets: [{
                    data: [stats.acertos, stats.erros],
                    backgroundColor: ['#0982c3', '#F44336'],
                    borderWidth: 0
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      labels: { color: 'white' }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Botão de reiniciar */}
        <button
          onClick={restartQuiz}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Fazer Novo Teste
        </button>
      </div>
    );
  }

  // Tela de questão
  const currentQuestion = questions[currentIndex];
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header com tema e progresso */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-primary font-semibold">{currentQuestion.tema}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/50 text-sm">
            {currentIndex + 1} / {questions.length}
          </span>
          <div className="w-32 progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Pergunta */}
      <div className="card-primary mb-8">
        <p className="text-lg leading-relaxed">{currentQuestion.pergunta}</p>
      </div>

      {/* Alternativas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shuffledAlternatives.map((alternativa, index) => {
          const isCorrect = alternativa === currentQuestion.resposta;
          const isSelected = selectedAnswer === alternativa;
          
          let buttonClass = 'alternative-button';
          
          if (answered) {
            if (isCorrect) {
              buttonClass += ' !bg-success border-success';
            } else if (isSelected && !isCorrect) {
              buttonClass += ' !bg-error border-error';
            } else {
              buttonClass += ' opacity-50';
            }
          }
          
          // Se houver 5 alternativas e for a última, ocupar 2 colunas
          const isLastOdd = shuffledAlternatives.length % 2 === 1 && 
                           index === shuffledAlternatives.length - 1;

          return (
            <button
              key={index}
              onClick={() => handleAnswer(alternativa)}
              disabled={answered}
              className={`${buttonClass} ${isLastOdd ? 'md:col-span-2' : ''}`}
            >
              <span className="font-medium">{alternativa}</span>
            </button>
          );
        })}
      </div>

      {/* Indicador de resposta */}
      {answered && (
        <div className={`
          mt-6 p-4 rounded-xl text-center animate-fade-in
          ${selectedAnswer === currentQuestion.resposta 
            ? 'bg-success/20 text-success' 
            : 'bg-error/20 text-error'}
        `}>
          {selectedAnswer === currentQuestion.resposta ? (
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Correto!</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <XCircle className="w-5 h-5" />
              <span className="font-semibold">Incorreto!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Quiz;
