import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Bar, Line, Radar } from 'react-chartjs-2';
import { listFiles, readFile } from '../utils/fileSystem';
import { parseDateTime, generateChartColors, formatarIntervalo } from '../utils/mathUtils';
import { useApp } from '../contexts/AppContext';
import Papa from 'papaparse';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BookOpen
} from 'lucide-react';

ChartJS.register(...registerables);

const RetentionAnalysis = () => {
  const { showNotification } = useApp();
  
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [chartType, setChartType] = useState('retention');

  // Carregar arquivos
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

  // Analisar dados quando arquivo é selecionado
  useEffect(() => {
    if (!selectedFile) {
      setAnalysis(null);
      return;
    }

    const analyzeData = async () => {
      try {
        setLoading(true);
        
        const content = await readFile('estatisticasPath', selectedFile);
        if (!content) {
          showNotification('Arquivo não encontrado', 'error');
          return;
        }

        const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
        const data = parsed.data;

        if (!data || data.length === 0) {
          showNotification('Nenhum dado encontrado', 'error');
          return;
        }

        const currentDate = new Date();
        const lambda = 0.0005;
        const temasData = {};
        const sessoesPorData = {};

        // Processar dados
        data.forEach(sessao => {
          const sessaoDateStr = sessao.Data + ' ' + (sessao.Hora || '00:00:00');
          const sessaoDate = parseDateTime(sessaoDateStr);
          const dateKey = sessao.Data;

          if (!sessoesPorData[dateKey]) {
            sessoesPorData[dateKey] = {
              acertos: 0,
              erros: 0,
              sessoes: 0
            };
          }
          sessoesPorData[dateKey].acertos += parseInt(sessao.Acertos, 10) || 0;
          sessoesPorData[dateKey].erros += parseInt(sessao.Erros, 10) || 0;
          sessoesPorData[dateKey].sessoes += 1;

          let temasSessao;
          try {
            temasSessao = JSON.parse(sessao.Temas);
          } catch {
            return;
          }

          for (const tema in temasSessao) {
            if (!temasData[tema]) {
              temasData[tema] = {
                acertos: 0,
                erros: 0,
                exposures: 0,
                lastExposure: sessaoDate,
                tempoTotal: 0,
                evolucao: []
              };
            }

            const temaInfo = temasSessao[tema];
            temasData[tema].acertos += temaInfo.acertos || 0;
            temasData[tema].erros += temaInfo.erros || 0;
            temasData[tema].exposures += 1;
            temasData[tema].tempoTotal += temaInfo.tempoMedio || 0;

            if (sessaoDate > temasData[tema].lastExposure) {
              temasData[tema].lastExposure = sessaoDate;
            }

            const total = temaInfo.acertos + temaInfo.erros;
            if (total > 0) {
              temasData[tema].evolucao.push({
                data: sessaoDate,
                taxa: temaInfo.acertos / total
              });
            }
          }
        });

        // Calcular métricas de retenção
        const temasAnalise = {};
        const temasRisco = [];
        const temasFortes = [];

        for (const tema in temasData) {
          const temaInfo = temasData[tema];
          const total = temaInfo.acertos + temaInfo.erros;
          const p_correct = total > 0 ? temaInfo.acertos / total : 0;
          
          const timeDiff = currentDate - temaInfo.lastExposure;
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          const retentionRate = p_correct * Math.exp(-lambda * hoursDiff);
          
          // Calcular entropia
          const p_incorrect = 1 - p_correct;
          const p_correct_safe = Math.max(0.01, p_correct);
          const p_incorrect_safe = Math.max(0.01, p_incorrect);
          const entropia = -(p_correct_safe * Math.log2(p_correct_safe) + 
                           p_incorrect_safe * Math.log2(p_incorrect_safe));

          // Próxima revisão
          const desiredRetention = 0.85;
          const hoursUntilReview = -Math.log(desiredRetention / p_correct_safe) / lambda;

          temasAnalise[tema] = {
            acertos: temaInfo.acertos,
            erros: temaInfo.erros,
            total,
            taxaAcerto: p_correct,
            retentionRate,
            entropia,
            exposures: temaInfo.exposures,
            diasDesdeUltimaRevisao: Math.floor(hoursDiff / 24),
            horasParaProximaRevisao: Math.max(0, hoursUntilReview),
            evolucao: temaInfo.evolucao.sort((a, b) => a.data - b.data)
          };

          if (retentionRate < 0.5 || hoursDiff > 168) { // Menos de 50% ou mais de 7 dias
            temasRisco.push({ tema, retentionRate, diasSemRevisao: Math.floor(hoursDiff / 24) });
          }
          
          if (p_correct >= 0.8 && temaInfo.exposures >= 3) {
            temasFortes.push({ tema, taxaAcerto: p_correct, exposures: temaInfo.exposures });
          }
        }

        setAnalysis({
          temas: temasAnalise,
          temasRisco: temasRisco.sort((a, b) => a.retentionRate - b.retentionRate),
          temasFortes: temasFortes.sort((a, b) => b.taxaAcerto - a.taxaAcerto),
          sessoesPorData,
          totalSessoes: data.length,
          totalQuestoes: Object.values(temasAnalise).reduce((sum, t) => sum + t.total, 0)
        });

      } catch (error) {
        console.error('Erro ao analisar dados:', error);
        showNotification('Erro ao processar dados', 'error');
      } finally {
        setLoading(false);
      }
    };

    analyzeData();
  }, [selectedFile, showNotification]);

  // Renderizar gráfico
  const renderChart = () => {
    if (!analysis) return null;

    const temas = Object.keys(analysis.temas);
    const colors = generateChartColors(temas.length);

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: 'white', font: { family: 'Poppins' } }
        }
      },
      scales: {
        x: {
          ticks: { color: 'rgba(255,255,255,0.7)' },
          grid: { color: 'rgba(255,255,255,0.1)' }
        },
        y: {
          beginAtZero: true,
          max: chartType === 'retention' ? 1 : undefined,
          ticks: { color: 'rgba(255,255,255,0.7)' },
          grid: { color: 'rgba(255,255,255,0.1)' }
        }
      }
    };

    switch (chartType) {
      case 'retention':
        return (
          <Bar
            data={{
              labels: temas,
              datasets: [{
                label: 'Taxa de Retenção',
                data: temas.map(t => analysis.temas[t].retentionRate),
                backgroundColor: temas.map(t => 
                  analysis.temas[t].retentionRate >= 0.7 ? 'rgba(76, 175, 80, 0.8)' :
                  analysis.temas[t].retentionRate >= 0.5 ? 'rgba(255, 152, 0, 0.8)' :
                  'rgba(244, 67, 54, 0.8)'
                ),
                borderRadius: 8
              }]
            }}
            options={chartOptions}
          />
        );

      case 'accuracy':
        return (
          <Bar
            data={{
              labels: temas,
              datasets: [
                {
                  label: 'Acertos',
                  data: temas.map(t => analysis.temas[t].acertos),
                  backgroundColor: '#4CAF50',
                  borderRadius: 8
                },
                {
                  label: 'Erros',
                  data: temas.map(t => analysis.temas[t].erros),
                  backgroundColor: '#F44336',
                  borderRadius: 8
                }
              ]
            }}
            options={chartOptions}
          />
        );

      case 'radar':
        return (
          <Radar
            data={{
              labels: temas,
              datasets: [{
                label: 'Desempenho por Tema',
                data: temas.map(t => analysis.temas[t].taxaAcerto * 100),
                backgroundColor: 'rgba(9, 130, 195, 0.2)',
                borderColor: '#0982c3',
                pointBackgroundColor: '#0982c3'
              }]
            }}
            options={{
              ...chartOptions,
              scales: {
                r: {
                  beginAtZero: true,
                  max: 100,
                  ticks: { color: 'rgba(255,255,255,0.7)' },
                  grid: { color: 'rgba(255,255,255,0.2)' },
                  pointLabels: { color: 'rgba(255,255,255,0.9)' }
                }
              }
            }}
          />
        );

      case 'evolucao':
        const dates = Object.keys(analysis.sessoesPorData).sort();
        return (
          <Line
            data={{
              labels: dates,
              datasets: [{
                label: 'Taxa de Acerto Diária',
                data: dates.map(d => {
                  const dia = analysis.sessoesPorData[d];
                  const total = dia.acertos + dia.erros;
                  return total > 0 ? (dia.acertos / total) * 100 : 0;
                }),
                borderColor: '#0982c3',
                backgroundColor: 'rgba(9, 130, 195, 0.2)',
                fill: true,
                tension: 0.4
              }]
            }}
            options={chartOptions}
          />
        );

      default:
        return null;
    }
  };

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
          <Brain className="w-8 h-8 text-primary" />
          Análise de Retenção
        </h2>
        <p className="text-white/60 mt-2">Entenda como você retém o conhecimento ao longo do tempo</p>
      </div>

      {/* Seletor de arquivo */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-48">
            <label className="block text-white/70 text-sm mb-2">
              <BookOpen className="w-4 h-4 inline mr-2" />
              Selecione a Matéria
            </label>
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

          {analysis && (
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'retention', label: 'Retenção' },
                { id: 'accuracy', label: 'Acertos/Erros' },
                { id: 'radar', label: 'Radar' },
                { id: 'evolucao', label: 'Evolução' }
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setChartType(id)}
                  className={`metric-button ${chartType === id ? 'bg-primary' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {analysis && (
        <div className="space-y-6 animate-fade-in">
          {/* Stats resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card text-center">
              <p className="text-white/60 text-sm">Total de Sessões</p>
              <p className="text-2xl font-bold text-primary">{analysis.totalSessoes}</p>
            </div>
            <div className="card text-center">
              <p className="text-white/60 text-sm">Total de Questões</p>
              <p className="text-2xl font-bold text-primary">{analysis.totalQuestoes}</p>
            </div>
            <div className="card text-center">
              <p className="text-white/60 text-sm">Temas em Risco</p>
              <p className="text-2xl font-bold text-error">{analysis.temasRisco.length}</p>
            </div>
            <div className="card text-center">
              <p className="text-white/60 text-sm">Temas Dominados</p>
              <p className="text-2xl font-bold text-success">{analysis.temasFortes.length}</p>
            </div>
          </div>

          {/* Gráfico */}
          <div className="card">
            <div className="h-80">
              {renderChart()}
            </div>
          </div>

          {/* Alertas e Recomendações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Temas em Risco */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-error" />
                Temas que Precisam de Atenção
              </h3>
              {analysis.temasRisco.length === 0 ? (
                <p className="text-white/50 text-center py-4">
                  Nenhum tema em risco! Continue assim.
                </p>
              ) : (
                <div className="space-y-3">
                  {analysis.temasRisco.slice(0, 5).map(({ tema, retentionRate, diasSemRevisao }) => (
                    <div key={tema} className="flex items-center justify-between p-3 bg-error/10 rounded-xl">
                      <div>
                        <p className="font-medium text-white">{tema}</p>
                        <p className="text-white/50 text-sm">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {diasSemRevisao} dias sem revisão
                        </p>
                      </div>
                      <span className="text-error font-bold">
                        {(retentionRate * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Temas Fortes */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                Temas Dominados
              </h3>
              {analysis.temasFortes.length === 0 ? (
                <p className="text-white/50 text-center py-4">
                  Continue praticando para dominar mais temas!
                </p>
              ) : (
                <div className="space-y-3">
                  {analysis.temasFortes.slice(0, 5).map(({ tema, taxaAcerto, exposures }) => (
                    <div key={tema} className="flex items-center justify-between p-3 bg-success/10 rounded-xl">
                      <div>
                        <p className="font-medium text-white">{tema}</p>
                        <p className="text-white/50 text-sm">
                          {exposures} sessões de prática
                        </p>
                      </div>
                      <span className="text-success font-bold">
                        {(taxaAcerto * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tabela detalhada */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Análise Detalhada por Tema
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header rounded-tl-xl">Tema</th>
                    <th className="table-header">Taxa de Acerto</th>
                    <th className="table-header">Retenção</th>
                    <th className="table-header">Exposições</th>
                    <th className="table-header rounded-tr-xl">Próxima Revisão</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analysis.temas)
                    .sort(([, a], [, b]) => a.retentionRate - b.retentionRate)
                    .map(([tema, data], index) => (
                    <tr key={tema} className={index % 2 === 0 ? 'bg-background-light/30' : ''}>
                      <td className="table-cell font-medium">{tema}</td>
                      <td className="table-cell">
                        <span className={
                          data.taxaAcerto >= 0.8 ? 'text-success' :
                          data.taxaAcerto >= 0.6 ? 'text-warning' : 'text-error'
                        }>
                          {(data.taxaAcerto * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-16 progress-bar">
                            <div 
                              className="progress-fill"
                              style={{ 
                                width: `${data.retentionRate * 100}%`,
                                backgroundColor: data.retentionRate >= 0.7 ? '#4CAF50' :
                                                data.retentionRate >= 0.5 ? '#FF9800' : '#F44336'
                              }}
                            />
                          </div>
                          <span className="text-white/70 text-sm">
                            {(data.retentionRate * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">{data.exposures}</td>
                      <td className="table-cell text-sm">
                        {formatarIntervalo(data.horasParaProximaRevisao)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!analysis && !loading && files.length > 0 && (
        <div className="card text-center py-12">
          <Brain className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/50">Selecione uma matéria para ver a análise de retenção</p>
        </div>
      )}

      {files.length === 0 && !loading && (
        <div className="card text-center py-12">
          <Brain className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/50">Nenhum dado de estatísticas encontrado</p>
          <p className="text-white/30 text-sm mt-2">Complete alguns testes para gerar dados</p>
        </div>
      )}
    </div>
  );
};

export default RetentionAnalysis;
