// Funções matemáticas e estatísticas

// Função de erro (erf)
export const erf = (x) => {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
};

// Função de distribuição cumulativa normal (CDF)
export const normalCdf = (x) => {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
};

// Calcular MSLE (Mean Squared Logarithmic Error)
export const calcularMSLE = (acertosReais, previsao) => {
  return Math.pow(Math.log1p(acertosReais) - Math.log1p(previsao), 2);
};

// Simulação de Monte Carlo
export const simularMonteCarlo = (p, numQuestoes, nSimulacoes, notaMedia) => {
  let contagemPassar = 0;
  for (let i = 0; i < nSimulacoes; i++) {
    let acertosSimulados = 0;
    for (let j = 0; j < numQuestoes; j++) {
      if (Math.random() < p) {
        acertosSimulados++;
      }
    }
    if (acertosSimulados >= notaMedia) {
      contagemPassar++;
    }
  }
  return (contagemPassar / nSimulacoes) * 100;
};

// Embaralhar array (Fisher-Yates shuffle)
export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Formatar tempo em horas, minutos e segundos
export const formatarTempo = (segundosTotais) => {
  const horas = Math.floor(segundosTotais / 3600);
  const minutos = Math.floor((segundosTotais % 3600) / 60);
  const segundos = Math.floor(segundosTotais % 60);

  let tempoFormatado = '';
  if (horas > 0) tempoFormatado += `${horas}h `;
  if (minutos > 0) tempoFormatado += `${minutos}m `;
  if (segundos > 0 || tempoFormatado === '') tempoFormatado += `${segundos}s`;

  return tempoFormatado.trim();
};

// Formatar intervalo em formato legível
export const formatarIntervalo = (hours) => {
  if (hours <= 0) {
    return 'Revisar agora';
  }

  const dias = Math.floor(hours / 24);
  const horasRestantes = Math.floor(hours % 24);
  const minutos = Math.floor((hours % 1) * 60);

  let intervalo = '';
  if (dias > 0) intervalo += `${dias} dia${dias > 1 ? 's' : ''} `;
  if (horasRestantes > 0) intervalo += `${horasRestantes} hora${horasRestantes > 1 ? 's' : ''} `;
  if (minutos > 0) intervalo += `${minutos} minuto${minutos > 1 ? 's' : ''}`;

  return intervalo.trim() || 'Agora';
};

// Parse de data e hora
export const parseDateTime = (dateTimeStr) => {
  const [dateStr, timeStr] = dateTimeStr.split(' ');
  const [day, month, year] = dateStr.split('/').map(Number);
  const [hours, minutes, seconds] = timeStr ? timeStr.split(':').map(Number) : [0, 0, 0];
  return new Date(year, month - 1, day, hours, minutes, seconds);
};

// Gerar cores para gráficos
export const generateChartColors = (count) => {
  const baseColors = [
    'rgba(9, 130, 195, 0.8)',
    'rgba(76, 175, 80, 0.8)',
    'rgba(244, 67, 54, 0.8)',
    'rgba(255, 152, 0, 0.8)',
    'rgba(156, 39, 176, 0.8)',
    'rgba(0, 188, 212, 0.8)',
    'rgba(255, 193, 7, 0.8)',
    'rgba(121, 85, 72, 0.8)',
    'rgba(96, 125, 139, 0.8)',
    'rgba(233, 30, 99, 0.8)',
  ];

  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  return colors;
};

// Calcular taxa de retenção com modelo de decaimento exponencial
export const calcularTaxaRetencao = (pCorrect, horasDiff, lambda = 0.0005) => {
  return pCorrect * Math.exp(-lambda * horasDiff);
};

// Calcular intervalo até próxima revisão
export const calcularIntervaloRevisao = (pCorrect, desiredRetention = 0.85, lambda = 0.0005) => {
  if (pCorrect <= 0) return 0;
  return -Math.log(desiredRetention / pCorrect) / lambda;
};
