import React, { useState, useEffect, useCallback } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { listFiles, readFile } from '../utils/fileSystem';
import { useApp } from '../contexts/AppContext';
import Papa from 'papaparse';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileText
} from 'lucide-react';

ChartJS.register(...registerables);

const Metrics = () => {
  const { showNotification } = useApp();
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [data, setData] = useState([]);
  const [chartType, setChartType] = useState('acertos');
  const [loading, setLoading] = useState(true);

  // Carregar lista de arquivos
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const fileList = await listFiles('estatisticasPath', '.csv');
        setFiles(fileList);
      } catch (error) {
        console.error('Erro ao carregar arquivos:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFiles();
  }, []);

  // Carregar sessões quando arquivo é selecionado
  const loadSessions = useCallback(async (filename) => {
    if (!filename) return;
    
    try {
      setLoading(true);
      const content = await readFile('estatisticasPath', filename);
      
      if (!content) {
        showNotification('Arquivo vazio ou não encontrado', 'error');
        return;
      }

      const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
      
      if (!parsed.data || parsed.data.length === 0) {
        showNotification('Nenhum dado encontrado no arquivo', 'warning');
        return;
      }

      setData(parsed.data);
      
      // Extrair sessões únicas
      const sessionIds = [...new Set(parsed.data.map(item => item.ID_Sessao))].sort();
      const sessionMappings = sessionIds.map((id, index) => ({
        id,
        name: `Sessão ${index + 1}`
      }));
      
      setSessions(sessionMappings);
      setSelectedSession('');
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
      showNotification('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    if (selectedFile) {
      loadSessions(selectedFile);
    }
  }, [selectedFile, loadSessions]);

  // Obter dados da sessão selecionada
  const getSessionData = useCallback(() => {
    if (!selectedSession || !data.length) return null;
    return data.find(item => item.ID_Sessao === selectedSession);
  }, [selectedSession, data]);

  // Configurações de gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'white',
          font: { family: 'Poppins' }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: 'rgba(255,255,255,0.7)' },
        grid: { color: 'rgba(255,255,255,0.1)' }
      },
      y: {
        beginAtZero: true,
        ticks: { color: 'rgba(255,255,255,0.7)' },
        grid: { color: 'rgba(255,255,255,0.1)' }
      }
    }
  };

  // Renderizar gráfico baseado no tipo
  const renderChart = () => {
    const sessionData = getSessionData();
    
    if (chartType === 'evolucao') {
      // Gráfico de evolução usa todos os dados
      const labels = data.map(sessao => sessao.Data);
      const acertos = data.map(sessao => parseInt(sessao.Acertos, 10));
      const erros = data.map(sessao => parseInt(sessao.Erros, 10));
      const tempoMedio = data.map(sessao => parseFloat(sessao.Tempo_Medio));

      return (
        <Line
          data={{
            labels,
            datasets: [
              {
                label: 'Acertos',
                data: acertos,
                borderColor: '#0982c3',
                backgroundColor: 'rgba(9, 130, 195, 0.2)',
                fill: true,
                tension: 0.4
              },
              {
                label: 'Erros',
                data: erros,
                borderColor: '#F44336',
                backgroundColor: 'rgba(244, 67, 54, 0.2)',
                fill: true,
                tension: 0.4
              },
              {
                label: 'Tempo Médio (s)',
                data: tempoMedio,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                fill: true,
                tension: 0.4
              }
            ]
          }}
          options={{
            ...chartOptions,
            plugins: {
              ...chartOptions.plugins,
              title: {
                display: true,
                text: 'Evolução do Desempenho',
                color: 'white',
                font: { size: 16, family: 'Poppins' }
              }
            }
          }}
        />
      );
    }

    if (!sessionData) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-white/50">
          <FileText className="w-16 h-16 mb-4" />
          <p>Selecione uma sessão para visualizar os dados</p>
        </div>
      );
    }

    let temas;
    try {
      temas = JSON.parse(sessionData.Temas);
    } catch {
      return <p className="text-white/50 text-center">Erro ao processar dados dos temas</p>;
    }

    const labels = Object.keys(temas);

    switch (chartType) {
      case 'acertos':
        return (
          <Bar
            data={{
              labels,
              datasets: [{
                label: 'Acertos por Tema',
                data: labels.map(tema => temas[tema].acertos),
                backgroundColor: '#4CAF50',
                borderRadius: 8
              }]
            }}
            options={chartOptions}
          />
        );
      
      case 'erros':
        return (
          <Bar
            data={{
              labels,
              datasets: [{
                label: 'Erros por Tema',
                data: labels.map(tema => temas[tema].erros),
                backgroundColor: '#F44336',
                borderRadius: 8
              }]
            }}
            options={chartOptions}
          />
        );
      
      case 'tempo':
        return (
          <Bar
            data={{
              labels,
              datasets: [{
                label: 'Tempo Médio por Tema (s)',
                data: labels.map(tema => temas[tema].tempoMedio || 0),
                backgroundColor: '#0982c3',
                borderRadius: 8
              }]
            }}
            options={chartOptions}
          />
        );
      
      case 'pizza':
        const totalAcertos = Object.values(temas).reduce((sum, tema) => sum + tema.acertos, 0);
        const totalErros = Object.values(temas).reduce((sum, tema) => sum + tema.erros, 0);
        
        return (
          <Pie
            data={{
              labels: ['Acertos', 'Erros'],
              datasets: [{
                data: [totalAcertos, totalErros],
                backgroundColor: ['#0982c3', '#F44336'],
                borderWidth: 0
              }]
            }}
            options={{
              ...chartOptions,
              scales: undefined,
              plugins: {
                ...chartOptions.plugins,
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const total = totalAcertos + totalErros;
                      const percentage = ((context.raw / total) * 100).toFixed(1);
                      return `${context.label}: ${context.raw} (${percentage}%)`;
                    }
                  }
                }
              }
            }}
          />
        );
      
      default:
        return null;
    }
  };

  const metricButtons = [
    { id: 'acertos', label: 'Acertos', icon: CheckCircle, color: 'text-success' },
    { id: 'erros', label: 'Erros', icon: XCircle, color: 'text-error' },
    { id: 'tempo', label: 'Tempo Médio', icon: Clock, color: 'text-primary' },
    { id: 'pizza', label: 'Pizza', icon: PieChart, color: 'text-warning' },
    { id: 'evolucao', label: 'Evolução', icon: TrendingUp, color: 'text-primary' },
  ];

  if (loading && files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-white/50">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          Métricas de Desempenho
        </h2>
        <p className="text-white/60 mt-2">Analise seu progresso e identifique áreas de melhoria</p>
      </div>

      {/* Controls */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Seletor de arquivo */}
          <div>
            <label className="block text-white/70 text-sm mb-2">Arquivo de Estatísticas</label>
            <select
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
              className="select-field"
            >
              <option value="">Selecione um arquivo</option>
              {files.map(file => (
                <option key={file} value={file}>{file.replace('.csv', '')}</option>
              ))}
            </select>
          </div>

          {/* Seletor de sessão */}
          <div>
            <label className="block text-white/70 text-sm mb-2">Sessão</label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="select-field"
              disabled={!sessions.length}
            >
              <option value="">Selecione uma sessão</option>
              {sessions.map(session => (
                <option key={session.id} value={session.id}>{session.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Botões de métrica */}
        <div className="flex flex-wrap gap-2">
          {metricButtons.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => setChartType(id)}
              disabled={!selectedFile && id !== 'evolucao'}
              className={`
                metric-button flex items-center gap-2
                ${chartType === id ? 'bg-primary' : ''}
              `}
            >
              <Icon className={`w-4 h-4 ${chartType === id ? 'text-white' : color}`} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <div className="h-96">
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/50">
              <FileText className="w-16 h-16 mb-4" />
              <p>Nenhum arquivo de estatísticas encontrado</p>
              <p className="text-sm mt-2">Complete alguns testes para gerar dados</p>
            </div>
          ) : (
            renderChart()
          )}
        </div>
      </div>
    </div>
  );
};

export default Metrics;
