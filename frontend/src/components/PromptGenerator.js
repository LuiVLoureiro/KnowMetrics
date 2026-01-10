import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { 
  Sparkles, 
  Copy, 
  Check,
  FileSpreadsheet,
  Lightbulb,
  Settings,
  BookOpen,
  Target,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

const PromptGenerator = () => {
  const { showNotification } = useApp();
  
  // Form state
  const [topic, setTopic] = useState('');
  const [subtopics, setSubtopics] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState('mixed');
  const [language, setLanguage] = useState('portuguese');
  const [numAlternatives, setNumAlternatives] = useState(4);
  const [includeExplanation, setIncludeExplanation] = useState(true);
  
  // UI state
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Generate the prompt
  const generatePrompt = () => {
    if (!topic.trim()) {
      showNotification('Please enter a topic', 'warning');
      return;
    }

    const difficultyText = {
      'easy': 'fáceis (nível 1-2)',
      'medium': 'de dificuldade média (nível 2-3)',
      'hard': 'difíceis (nível 4-5)',
      'mixed': 'com dificuldade variada (níveis 1 a 5)'
    };

    const difficultyTextEN = {
      'easy': 'easy (level 1-2)',
      'medium': 'medium difficulty (level 2-3)',
      'hard': 'hard (level 4-5)',
      'mixed': 'with varied difficulty (levels 1 to 5)'
    };

    const langConfig = {
      portuguese: {
        diffText: difficultyText[difficulty],
        intro: `Você é um especialista em criar questões de múltipla escolha para estudos e provas.`,
        task: `Crie exatamente ${numQuestions} questões de múltipla escolha sobre o tema "${topic}"${subtopics ? `, focando nos subtópicos: ${subtopics}` : ''}.`,
        requirements: `
As questões devem ser ${difficultyText[difficulty]}.
Cada questão deve ter exatamente ${numAlternatives} alternativas.
${includeExplanation ? 'Inclua uma breve explicação para cada resposta correta.' : 'Não inclua explicações.'}`,
        formatIntro: `IMPORTANTE: Sua resposta deve ser APENAS um arquivo CSV válido, sem nenhum texto adicional antes ou depois.`,
        csvHeader: `topic,question_text,alternative_1,alternative_2,alternative_3,alternative_4${numAlternatives >= 5 ? ',alternative_5' : ''}${numAlternatives >= 6 ? ',alternative_6' : ''},correct_answer,explanation,difficulty`,
        rules: `
REGRAS OBRIGATÓRIAS:
1. Retorne SOMENTE o conteúdo CSV, começando diretamente com o cabeçalho
2. Não use markdown, não coloque \`\`\`csv ou qualquer formatação
3. Use vírgulas para separar campos
4. Se um campo contiver vírgulas, coloque-o entre aspas duplas
5. O campo "correct_answer" deve ser EXATAMENTE igual a uma das alternativas
6. O campo "difficulty" deve ser um número de 1 a 5
7. Todos os campos são obrigatórios${!includeExplanation ? ' (exceto explanation, deixe vazio)' : ''}
8. Não inclua linhas vazias
9. Use ${language === 'portuguese' ? 'português brasileiro' : 'inglês'} para as questões`,
        example: `
EXEMPLO de formato esperado (primeira linha é o cabeçalho):
topic,question_text,alternative_1,alternative_2,alternative_3,alternative_4,correct_answer,explanation,difficulty
${topic},Qual é a capital do Brasil?,São Paulo,Rio de Janeiro,Brasília,Salvador,Brasília,Brasília é a capital federal desde 1960,1`
      },
      english: {
        diffText: difficultyTextEN[difficulty],
        intro: `You are an expert in creating multiple choice questions for studying and exams.`,
        task: `Create exactly ${numQuestions} multiple choice questions about "${topic}"${subtopics ? `, focusing on the subtopics: ${subtopics}` : ''}.`,
        requirements: `
The questions should be ${difficultyTextEN[difficulty]}.
Each question must have exactly ${numAlternatives} alternatives.
${includeExplanation ? 'Include a brief explanation for each correct answer.' : 'Do not include explanations.'}`,
        formatIntro: `IMPORTANT: Your response must be ONLY a valid CSV file, with no additional text before or after.`,
        csvHeader: `topic,question_text,alternative_1,alternative_2,alternative_3,alternative_4${numAlternatives >= 5 ? ',alternative_5' : ''}${numAlternatives >= 6 ? ',alternative_6' : ''},correct_answer,explanation,difficulty`,
        rules: `
MANDATORY RULES:
1. Return ONLY the CSV content, starting directly with the header
2. Do not use markdown, do not put \`\`\`csv or any formatting
3. Use commas to separate fields
4. If a field contains commas, enclose it in double quotes
5. The "correct_answer" field must be EXACTLY the same as one of the alternatives
6. The "difficulty" field must be a number from 1 to 5
7. All fields are required${!includeExplanation ? ' (except explanation, leave it empty)' : ''}
8. Do not include blank lines
9. Use ${language === 'portuguese' ? 'Brazilian Portuguese' : 'English'} for the questions`,
        example: `
EXAMPLE of expected format (first line is the header):
topic,question_text,alternative_1,alternative_2,alternative_3,alternative_4,correct_answer,explanation,difficulty
${topic},What is the capital of Brazil?,São Paulo,Rio de Janeiro,Brasília,Salvador,Brasília,Brasília has been the capital since 1960,1`
      }
    };

    const config = langConfig[language];

    const downloadInstructions = language === 'portuguese' 
      ? `

INSTRUÇÕES DE DOWNLOAD:
Após gerar o conteúdo CSV, forneça um link/botão para download do arquivo .csv OU exiba o conteúdo em um bloco de código com a opção de copiar, instruindo o usuário a:
1. Copiar todo o conteúdo CSV
2. Abrir um editor de texto (Bloco de Notas, VS Code, etc.)
3. Colar o conteúdo
4. Salvar o arquivo com extensão .csv (exemplo: quiz_${topic.replace(/\s+/g, '_').toLowerCase()}.csv)
5. Selecionar codificação UTF-8 ao salvar

Se você tiver a capacidade de gerar arquivos para download, gere diretamente o arquivo CSV para download com o nome "quiz_${topic.replace(/\s+/g, '_').toLowerCase()}.csv".`
      : `

DOWNLOAD INSTRUCTIONS:
After generating the CSV content, provide a download link/button for the .csv file OR display the content in a code block with copy option, instructing the user to:
1. Copy all the CSV content
2. Open a text editor (Notepad, VS Code, etc.)
3. Paste the content
4. Save the file with .csv extension (example: quiz_${topic.replace(/\s+/g, '_').toLowerCase()}.csv)
5. Select UTF-8 encoding when saving

If you have the ability to generate downloadable files, directly generate the CSV file for download named "quiz_${topic.replace(/\s+/g, '_').toLowerCase()}.csv".`;

    const prompt = `${config.intro}

${config.task}
${config.requirements}

${config.formatIntro}

O formato CSV deve ter estas colunas:
${config.csvHeader}
${config.rules}
${config.example}
${downloadInstructions}

Agora gere as ${numQuestions} questões sobre "${topic}" no formato CSV especificado acima.`;

    setGeneratedPrompt(prompt);
    setCopied(false);
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      showNotification('Prompt copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      showNotification('Failed to copy', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          Prompt Generator
        </h2>
        <p className="text-white/60 mt-2">
          Generate optimized prompts to create quiz questions with AI
        </p>
      </div>

      {/* Instructions Card */}
      <div className="card bg-primary/10 border border-primary/30 mb-6">
        <div className="flex gap-4">
          <Info className="w-6 h-6 text-primary flex-shrink-0" />
          <div>
            <h4 className="text-white font-medium mb-2">How it works</h4>
            <ol className="text-white/70 text-sm space-y-1 list-decimal list-inside">
              <li>Enter your topic and configure the options below</li>
              <li>Click "Generate Prompt" to create an optimized prompt</li>
              <li>Copy the prompt and paste it in ChatGPT, Claude, or another AI</li>
              <li><strong>Download the CSV file</strong> generated by the AI (or copy and save manually)</li>
              <li>Go to <strong>Import Questions</strong> page and upload the .csv file</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="card mb-6">
        <div className="space-y-4">
          {/* Topic */}
          <div>
            <label className="block text-white/70 text-sm mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Main Topic *
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Brazilian History, Python Programming, Calculus..."
              className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
            />
          </div>

          {/* Subtopics */}
          <div>
            <label className="block text-white/70 text-sm mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Subtopics (optional)
            </label>
            <input
              type="text"
              value={subtopics}
              onChange={(e) => setSubtopics(e.target.value)}
              placeholder="e.g., Independence, Republic, Military Dictatorship..."
              className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
            />
            <p className="text-white/40 text-xs mt-1">Separate multiple subtopics with commas</p>
          </div>

          {/* Quick Settings */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Number of Questions */}
            <div>
              <label className="block text-white/70 text-sm mb-2">
                Number of Questions
              </label>
              <select
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
              >
                <option value={5}>5 questions</option>
                <option value={10}>10 questions</option>
                <option value={15}>15 questions</option>
                <option value={20}>20 questions</option>
                <option value={30}>30 questions</option>
                <option value={50}>50 questions</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-white/70 text-sm mb-2">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-white/70 text-sm mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
              >
                <option value="portuguese">Portuguese</option>
                <option value="english">English</option>
              </select>
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Advanced Settings</span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="bg-background rounded-xl p-4 space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                {/* Number of Alternatives */}
                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    Alternatives per Question
                  </label>
                  <select
                    value={numAlternatives}
                    onChange={(e) => setNumAlternatives(Number(e.target.value))}
                    className="w-full bg-card border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
                  >
                    <option value={2}>2 alternatives</option>
                    <option value={3}>3 alternatives</option>
                    <option value={4}>4 alternatives</option>
                    <option value={5}>5 alternatives</option>
                    <option value={6}>6 alternatives</option>
                  </select>
                </div>

                {/* Include Explanation */}
                <div>
                  <label className="block text-white/70 text-sm mb-2">
                    Include Explanations
                  </label>
                  <div className="flex items-center gap-3 h-12">
                    <button
                      onClick={() => setIncludeExplanation(true)}
                      className={`flex-1 py-2 rounded-lg transition-colors ${
                        includeExplanation 
                          ? 'bg-primary text-white' 
                          : 'bg-card text-white/50 hover:text-white'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setIncludeExplanation(false)}
                      className={`flex-1 py-2 rounded-lg transition-colors ${
                        !includeExplanation 
                          ? 'bg-primary text-white' 
                          : 'bg-card text-white/50 hover:text-white'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={generatePrompt}
            disabled={!topic.trim()}
            className="w-full btn-primary py-4 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Generate Prompt
          </button>
        </div>
      </div>

      {/* Generated Prompt */}
      {generatedPrompt && (
        <div className="card animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Generated Prompt
            </h3>
            <button
              onClick={copyToClipboard}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                copied 
                  ? 'bg-success text-white' 
                  : 'bg-primary/20 text-primary hover:bg-primary/30'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Prompt
                </>
              )}
            </button>
          </div>

          <div className="bg-background rounded-xl p-4 max-h-96 overflow-y-auto">
            <pre className="text-white/80 text-sm whitespace-pre-wrap font-mono">
              {generatedPrompt}
            </pre>
          </div>

          {/* Next Steps */}
          <div className="mt-4 p-4 bg-success/10 border border-success/30 rounded-xl">
            <h4 className="text-success font-medium mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Next Steps
            </h4>
            <ol className="text-white/70 text-sm space-y-2 list-decimal list-inside">
              <li>Copy the prompt above</li>
              <li>Paste it in <strong>ChatGPT</strong>, <strong>Claude</strong>, or another AI</li>
              <li>
                <strong>Download the CSV:</strong>
                <ul className="ml-5 mt-1 list-disc list-inside text-white/60">
                  <li>If the AI offers a download button, click it</li>
                  <li>Otherwise, copy the CSV content from the AI response</li>
                  <li>Open Notepad or any text editor</li>
                  <li>Paste and save as <strong>.csv</strong> (use UTF-8 encoding)</li>
                </ul>
              </li>
              <li>Go to <strong>Import Questions</strong> page and upload the .csv file</li>
            </ol>
          </div>
        </div>
      )}

      {/* Tips Card */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-warning" />
          Tips for Better Results
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-background rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">🎯 Be Specific</h4>
            <p className="text-white/60">
              Instead of "Math", try "Calculus - Derivatives and Integrals" for more focused questions.
            </p>
          </div>
          <div className="bg-background rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">📚 Use Subtopics</h4>
            <p className="text-white/60">
              Add subtopics to ensure coverage of all areas you want to study.
            </p>
          </div>
          <div className="bg-background rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">🔄 Regenerate if Needed</h4>
            <p className="text-white/60">
              If the AI doesn't format correctly, try again or ask it to fix the CSV format.
            </p>
          </div>
          <div className="bg-background rounded-xl p-4">
            <h4 className="text-white font-medium mb-2">✅ Verify Before Import</h4>
            <p className="text-white/60">
              Open the CSV file to check if the questions and answers are correct before importing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptGenerator;