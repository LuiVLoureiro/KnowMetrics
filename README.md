# KnowMetrics - Quiz Analytics App

![KnowMetrics](https://img.shields.io/badge/version-2.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.2-61dafb.svg)
![Electron](https://img.shields.io/badge/Electron-31-47848f.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3-38bdf8.svg)

A desktop application for studying with flashcards and performance analysis, built with React, Electron, and TailwindCSS.

## ✨ Features

### 📊 Performance Metrics
- Visualization of correct and incorrect answers by topic.
- Average time per question charts.
- Performance evolution over time.
- Pie charts for hit/miss ratios.

### 📝 Quiz System
- Questions with shuffled alternatives.
- Immediate visual feedback.
- Per-question timer.
- Automatically saved statistics.

### ➕ Question Creation
- Intuitive interface for adding questions.
- Support for multiple alternatives (2-6).
- Preview before saving.
- Organization by files/subjects.

### 🎯 Performance Prediction
- Approval probability calculation.
- Exam time estimation.
- Retention analysis by topic.
- Recommended study schedule.

### 🧠 Retention Analysis
- Exponential decay model.
- Identification of "at-risk" topics.
- Visualization of mastered topics.
- Performance radar charts.

## 🚀 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Steps

```bash
# Clone the repository
git clone https://github.com/LuiVLoureiro/KnowMetrics

# Enter the project folder
cd knowmetrics

# Install dependencies  
npm install

# Start the application in development mode
npm start
```

## 📦 Available Scripts

| Script | Description |
|--------|-----------|
| `npm start` | Starts React + Electron in development mode |
| `npm run start:react` | Starts only the React server |
| `npm run start:electron` | Starts only Electron |
| `npm run build` | Generates the React production build |
| `npm run build:electron` | Generates the Electron executable |

## 🏗️ Project Structure

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

## 📱 Technologies Used

- **React 18** - UI Library
- **Electron 31** - Desktop framework
- **TailwindCSS 3** - CSS framework
- **Chart.js** - Charts and graphs
- **PapaParse** - CSV parser
- **Lucide React** - Icons
- **UUID** - ID generation

## 🎨 Design System

### Cores
- **Primary**: `#0982c3` (Blue)
- **Background**: `#1F252F` (Dark Gray)
- **Success**: `#4CAF50` (Green)
- **Error**: `#F44336` (Red)
- **Warning**: `#FF9800` (Orange)

### Components
The application uses components styled with Tailwind utility classes:

```css
.btn-primary    /* Botão primário */
.btn-secondary  /* Botão secundário */
.card           /* Card padrão */
.card-primary   /* Card com destaque */
.input-field    /* Campo de entrada */
.select-field   /* Campo de seleção */
```

## 📄 Data Format

### Questions (JSON)
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

### Statistics (CSV)
```csv
Session_ID,ID,Date,Time,Hits,Misses,Avg_Time,Topics
uuid,10,01/01/2024,10:30:00,8,2,15.5,"{...}"
```

## 🤝 Contributing

1. Fork the project.
2. Create a branch for your feature (git checkout -b feature/AmazingFeature).
3. Commit your changes (git commit -m 'Add some AmazingFeature').
4. Push to the branch (git push origin feature/AmazingFeature).
5. Open a Pull Request.

## 📝 License

This project is licensed under the ISC License. See the LICENSE file for more details.

## 👤 Author

**Lui Loureiro**

---

⭐ If this project helped you, consider giving it a star!
