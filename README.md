# KnowMetrics - Quiz Analytics App

![KnowMetrics](https://img.shields.io/badge/version-2.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.2-61dafb.svg)
![Electron](https://img.shields.io/badge/Electron-31-47848f.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3-38bdf8.svg)

Uma aplicação desktop para estudo com flashcards e análise de desempenho, construída com React, Electron e TailwindCSS.

## ✨ Funcionalidades

### 📊 Métricas de Desempenho
- Visualização de acertos e erros por tema
- Gráficos de tempo médio por questão
- Evolução do desempenho ao longo do tempo
- Gráficos pizza para proporção de acertos/erros

### 📝 Sistema de Quiz
- Questões com alternativas embaralhadas
- Feedback visual imediato
- Contagem de tempo por questão
- Estatísticas salvas automaticamente

### ➕ Criação de Questões
- Interface intuitiva para adicionar questões
- Suporte a múltiplas alternativas (2-6)
- Pré-visualização antes de salvar
- Organização por arquivos/matérias

### 🎯 Previsão de Desempenho
- Cálculo de probabilidade de aprovação
- Estimativa de tempo para provas
- Análise de retenção por tema
- Cronograma de estudos recomendado

### 🧠 Análise de Retenção
- Modelo de decaimento exponencial
- Identificação de temas em risco
- Visualização de temas dominados
- Gráficos radar de desempenho

## 🚀 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Passos

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/knowmetrics.git

# Entre na pasta do projeto
cd knowmetrics

# Instale as dependências
npm install

# Inicie a aplicação em modo desenvolvimento
npm start
```

## 📦 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm start` | Inicia React + Electron em modo desenvolvimento |
| `npm run start:react` | Inicia apenas o servidor React |
| `npm run start:electron` | Inicia apenas o Electron |
| `npm run build` | Gera build de produção do React |
| `npm run build:electron` | Gera executável do Electron |

## 🏗️ Estrutura do Projeto

```
knowmetrics/
├── electron/
│   └── main.js           # Processo principal do Electron
├── public/
│   └── index.html        # Template HTML
├── src/
│   ├── components/       # Componentes React
│   │   ├── CreateQuestion.js
│   │   ├── Metrics.js
│   │   ├── Notification.js
│   │   ├── PerformancePrediction.js
│   │   ├── Quiz.js
│   │   ├── RetentionAnalysis.js
│   │   └── Sidebar.js
│   ├── contexts/
│   │   └── AppContext.js # Estado global
│   ├── utils/
│   │   ├── fileSystem.js # API de arquivos
│   │   └── mathUtils.js  # Funções matemáticas
│   ├── App.js
│   ├── index.css         # Estilos Tailwind
│   └── index.js          # Entrada React
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

## 📱 Tecnologias Utilizadas

- **React 18** - Biblioteca UI
- **Electron 31** - Framework desktop
- **TailwindCSS 3** - Framework CSS
- **Chart.js** - Gráficos
- **PapaParse** - Parser CSV
- **Lucide React** - Ícones
- **UUID** - Geração de IDs

## 🎨 Design System

### Cores
- **Primary**: `#0982c3` (Azul)
- **Background**: `#1F252F` (Cinza escuro)
- **Success**: `#4CAF50` (Verde)
- **Error**: `#F44336` (Vermelho)
- **Warning**: `#FF9800` (Laranja)

### Componentes
A aplicação utiliza componentes estilizados com classes utilitárias do Tailwind:

```css
.btn-primary    /* Botão primário */
.btn-secondary  /* Botão secundário */
.card           /* Card padrão */
.card-primary   /* Card com destaque */
.input-field    /* Campo de entrada */
.select-field   /* Campo de seleção */
```

## 📄 Formato dos Dados

### Questões (JSON)
```json
[
  {
    "id": 1,
    "tema": "Matemática",
    "pergunta": "Quanto é 2 + 2?",
    "alternativas": ["3", "4", "5", "6"],
    "resposta": "4"
  }
]
```

### Estatísticas (CSV)
```csv
ID_Sessao,ID,Data,Hora,Acertos,Erros,Tempo_Medio,Temas
uuid,10,01/01/2024,10:30:00,8,2,15.5,"{...}"
```

## 🤝 Contribuindo

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença ISC. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👤 Autor

**Lui Loureiro**

---

⭐ Se este projeto te ajudou, considere dar uma estrela!
