import React, { useState, useEffect } from 'react';
import { listFiles, readFile } from '../utils/fileSystem';
import { normalCdf, calcularMSLE, formatarTempo, formatarIntervalo, parseDateTime } from '../utils/mathUtils';
import { useApp } from '../contexts/AppContext';
import Papa from 'papaparse';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Percent,
  Calculator,
  Calendar,
  BookOpen
} from 'lucide-react';

const PerformancePrediction = () => {
  const { showNotification } = useApp();
  
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [numQuestoes, setNumQuestoes] = useState('');
  const [notaMedia, setNotaMedia] = useState('');
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState(null);

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

  // Calcular previsão
  const calcularPrevisao = async () => {
    if (!selectedFile || !numQuestoes || !notaMedia) {
      showNotification('Preencha todos os campos', 'warning');
      return;
    }

    try {
      setCalculating(true);
      
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
      let totalAcertos = 0;
      let totalErros = 0;
      let totalQuestoes = 0;
      const temasData = {};

      // Processar dados
      data.forEach(sessao => {
        const acertos = parseInt(sessao.Acertos, 10);
        const erros = parseInt(sessao.Erros, 10);
        
        if (isNaN(acertos) || isNaN(erros)) return;

        const sessaoDateStr = sessao.Data + ' ' + (sessao.Hora || '00:00:00');
        const sessaoDate = parseDateTime(sessaoDateStr);

        let temasSessao;
        try {
          temasSessao = JSON.parse(sessao.Temas);
        } catch {
          return;
        }

        for (const tema in temasSessao) {
          if (!temasData[tema]) {
            temasData[tema] = {
              n_correct: 0,
              n_incorrect: 0,
              n_presented: 0,
              exposures: 0,
              lastExposure: sessaoDate
            };
          }

          const temaData = temasData[tema];
          const acertosTema = temasSessao[tema].acertos || 0;
          const errosTema = temasSessao[tema].erros || 0;

          temaData.n_correct += acertosTema;
          temaData.n_incorrect += errosTema;
          temaData.n_presented += acertosTema + errosTema;
          temaData.exposures += 1;

          if (sessaoDate > temaData.lastExposure) {
            temaData.lastExposure = sessaoDate;
          }
        }

        totalAcertos += acertos;
        totalErros += erros;
        totalQuestoes += (acertos + erros);
      });

      if (totalQuestoes === 0) {
        showNotification('Dados insuficientes para calcular', 'error');
        return;
      }

      // Cálculos estatísticos
      const p = totalAcertos / totalQuestoes;
      const numQ = parseInt(numQuestoes, 10);
      const notaM = parseFloat(notaMedia);
      
      const mean = p * numQ;
      const stddev = Math.sqrt(numQ * p * (1 - p));

      // Probabilidade de passar
      const z = ((notaM - 0.5) - mean) / stddev;
      let probabilidadePassar = (1 - normalCdf(z)) * 100;

      // Ajuste com MSLE
      let totalErro = 0;
      data.forEach(sessao => {
        const acertosReais = parseInt(sessao.Acertos, 10);
        const errosReais = parseInt(sessao.Erros, 10);
        const totalQuestoesSessao = acertosReais + errosReais;
        const previsao = p * totalQuestoesSessao;
        totalErro += calcularMSLE(acertosReais, previsao);
      });
      const msle = totalErro / data.length;
      const ajuste = msle / numQ;
      probabilidadePassar -= ajuste * 100;
      probabilidadePassar = Math.max(0, Math.min(100, probabilidadePassar));

      // Tempo previsto
      const totalTempo = data.reduce((acc, sessao) => {
        const acertos = parseInt(sessao.Acertos, 10);
        const erros = parseInt(sessao.Erros, 10);
        const tempoMedio = parseFloat(sessao.Tempo_Medio);
        if (isNaN(tempoMedio)) return acc;
        const totalSessao = acertos + erros;
        return acc + (tempoMedio * totalSessao);
      }, 0);

      const tempoMedioPorQuestao = totalQuestoes > 0 ? (totalTempo / totalQuestoes) : 0;
      const tempoPrevistoProva = tempoMedioPorQuestao * numQ;

      // Calcular retenção por tema
      const lambda = 0.0005;
      const retencaoTemas = {};
      const cronograma = [];

      for (const tema in temasData) {
        const temaData = temasData[tema];
        const p_correct = temaData.n_correct / temaData.n_presented;
        const p_incorrect = temaData.n_incorrect / temaData.n_presented;

        const p_correct_nonzero = p_correct > 0 ? p_correct : 0.01;
        const p_incorrect_nonzero = p_incorrect > 0 ? p_incorrect : 0.01;

        const entropia = -(p_correct_nonzero * Math.log2(p_correct_nonzero) + 
                         p_incorrect_nonzero * Math.log2(p_incorrect_nonzero));
        const familiaridade = temaData.exposures;
        const indicePrioridade = entropia / familiaridade;

        const timeDiff = currentDate - temaData.lastExposure;
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        const retentionRate = p_correct * Math.exp(-lambda * hoursDiff);

        retencaoTemas[tema] = retentionRate;

        const desiredRetention = 0.85;
        let hoursUntilReview = -Math.log(desiredRetention / p_correct_nonzero) / lambda;

        const lastExposureTime = temaData.lastExposure.getTime();
        const scheduledTime = lastExposureTime + hoursUntilReview * 60 * 60 * 1000;
        if (scheduledTime < currentDate.getTime()) {
          hoursUntilReview = 0;
        }

        cronograma.push({
          tema,
          retentionRate,
          hoursUntilReview,
          indicePrioridade
        });
      }

      cronograma.sort((a, b) => b.indicePrioridade - a.indicePrioridade);

      setResult({
        previsaoAcertos: mean,
        tempoEstimado: formatarTempo(tempoPrevistoProva),
        probabilidadePassar,
        retencaoTemas,
        cronograma
      });

    } catch (error) {
      console.error('Erro ao calcular previsão:', error);
      showNotification('Erro ao processar dados', 'error');
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-white/50">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
          <TrendingUp className="w-8 h-8 text-primary" />
          Previsão de Desempenho
        </h2>
        <p className="text-white/60 mt-2">Estime seu desempenho em provas futuras</p>
      </div>

      {/* Formulário */}
      <div className="card mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-white/70 text-sm mb-2">
              <BookOpen className="w-4 h-4 inline mr-2" />
              Matéria
            </label>
            <select
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
              className="select-field"
            >
              <option value="">Selecione</option>
              {files.map(file => (
                <option key={file} value={file}>{file.replace('.csv', '')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">
              <Target className="w-4 h-4 inline mr-2" />
              Número de Questões
            </label>
            <input
              type="number"
              value={numQuestoes}
              onChange={(e) => setNumQuestoes(e.target.value)}
              placeholder="Ex: 50"
              className="input-field"
              min="1"
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">
              <Percent className="w-4 h-4 inline mr-2" />
              Nota Mínima para Aprovação
            </label>
            <input
              type="number"
              value={notaMedia}
              onChange={(e) => setNotaMedia(e.target.value)}
              placeholder="Ex: 30"
              className="input-field"
              min="1"
            />
          </div>
        </div>

        <button
          onClick={calcularPrevisao}
          disabled={calculating || !selectedFile}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Calculator className="w-5 h-5" />
          {calculating ? 'Calculando...' : 'Calcular Previsão'}
        </button>
      </div>

      {/* Resultados */}
      {result && (
        <div className="animate-fade-in space-y-6">
          {/* Cards de métricas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-primary text-center">
              <Target className="w-8 h-8 mx-auto mb-2" />
              <p className="text-white/70 text-sm">Previsão de Acertos</p>
              <p className="text-3xl font-bold">{result.previsaoAcertos.toFixed(1)}</p>
            </div>

            <div className="card text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-white/70 text-sm">Tempo Estimado</p>
              <p className="text-2xl font-bold text-primary">{result.tempoEstimado}</p>
            </div>

            <div className={`card text-center ${
              result.probabilidadePassar >= 70 ? 'border-2 border-success' :
              result.probabilidadePassar >= 50 ? 'border-2 border-warning' :
              'border-2 border-error'
            }`}>
              <Percent className="w-8 h-8 mx-auto mb-2 text-success" />
              <p className="text-white/70 text-sm">Probabilidade de Passar</p>
              <p className={`text-3xl font-bold ${
                result.probabilidadePassar >= 70 ? 'text-success' :
                result.probabilidadePassar >= 50 ? 'text-warning' :
                'text-error'
              }`}>
                {result.probabilidadePassar.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Tabela de Retenção */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Taxa de Retenção por Tema
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header rounded-tl-xl">Tema</th>
                    <th className="table-header rounded-tr-xl">Taxa de Retenção</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.retencaoTemas).map(([tema, taxa], index) => (
                    <tr key={tema} className={index % 2 === 0 ? 'bg-background-light/30' : ''}>
                      <td className="table-cell">{tema}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-24 progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ 
                                width: `${taxa * 100}%`,
                                backgroundColor: taxa >= 0.7 ? '#4CAF50' : 
                                                taxa >= 0.5 ? '#FF9800' : '#F44336'
                              }}
                            />
                          </div>
                          <span className={
                            taxa >= 0.7 ? 'text-success' :
                            taxa >= 0.5 ? 'text-warning' : 'text-error'
                          }>
                            {(taxa * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cronograma de Estudos */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Cronograma de Estudos Recomendado
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header rounded-tl-xl">Prioridade</th>
                    <th className="table-header">Tema</th>
                    <th className="table-header rounded-tr-xl">Próxima Revisão</th>
                  </tr>
                </thead>
                <tbody>
                  {result.cronograma.map((item, index) => (
                    <tr key={item.tema} className={index % 2 === 0 ? 'bg-background-light/30' : ''}>
                      <td className="table-cell">
                        <span className={`
                          px-3 py-1 rounded-full text-sm font-medium
                          ${index === 0 ? 'bg-error/20 text-error' :
                            index < 3 ? 'bg-warning/20 text-warning' :
                            'bg-primary/20 text-primary'}
                        `}>
                          #{index + 1}
                        </span>
                      </td>
                      <td className="table-cell font-medium">{item.tema}</td>
                      <td className="table-cell">
                        <span className={item.hoursUntilReview <= 0 ? 'text-error font-semibold' : ''}>
                          {formatarIntervalo(item.hoursUntilReview)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformancePrediction;
