import React, { useState, useRef } from 'react';
import api from '../services/api';
import { useApp } from '../contexts/AppContext';
import { 
  Upload, 
  FileText, 
  Download, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  RefreshCw,
  FileJson,
  FileSpreadsheet,
  HelpCircle
} from 'lucide-react';

const ImportQuestions = () => {
  const { showNotification } = useApp();
  const fileInputRef = useRef(null);
  
  const [quizName, setQuizName] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [csvColumns, setCsvColumns] = useState([]);

  // Load CSV column info
  const loadCsvColumns = async () => {
    try {
      const columns = await api.getCsvColumns();
      setCsvColumns(columns);
      setShowHelp(true);
    } catch (error) {
      showNotification('Error loading column info', 'error');
    }
  };

  // Download template
  const downloadTemplate = async () => {
    try {
      await api.downloadCsvTemplate();
      showNotification('Template downloaded!', 'success');
    } catch (error) {
      showNotification('Error downloading template', 'error');
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['.csv', '.json'];
      const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      
      if (!validTypes.includes(fileExt)) {
        showNotification('Please select a CSV or JSON file', 'warning');
        return;
      }
      
      setSelectedFile(file);
      setResult(null);
    }
  };

  // Import questions
  const handleImport = async () => {
    if (!selectedFile) {
      showNotification('Please select a file', 'warning');
      return;
    }
    
    if (!quizName.trim()) {
      showNotification('Please enter a quiz name', 'warning');
      return;
    }

    try {
      setImporting(true);
      setResult(null);
      
      const isJson = selectedFile.name.toLowerCase().endsWith('.json');
      
      const importResult = isJson 
        ? await api.importJson(selectedFile, quizName, quizDescription)
        : await api.importCsv(selectedFile, quizName, quizDescription);
      
      setResult(importResult);
      
      if (importResult.success) {
        showNotification(
          `Imported ${importResult.questions_imported} questions!`, 
          'success'
        );
      } else {
        showNotification('Import completed with errors', 'warning');
      }
      
    } catch (error) {
      showNotification(error.message || 'Import failed', 'error');
      setResult({
        success: false,
        questions_imported: 0,
        questions_failed: 0,
        errors: [error.message]
      });
    } finally {
      setImporting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedFile(null);
    setQuizName('');
    setQuizDescription('');
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
          <Upload className="w-8 h-8 text-primary" />
          Import Questions
        </h2>
        <p className="text-white/60 mt-2">
          Quickly add questions from CSV or JSON files
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={downloadTemplate}
          className="flex-1 card hover:bg-card/80 transition-colors p-4 flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5 text-primary" />
          <span className="text-white font-medium">Download CSV Template</span>
        </button>
        
        <button
          onClick={loadCsvColumns}
          className="flex-1 card hover:bg-card/80 transition-colors p-4 flex items-center justify-center gap-2"
        >
          <HelpCircle className="w-5 h-5 text-primary" />
          <span className="text-white font-medium">View Column Guide</span>
        </button>
      </div>

      {/* Column Guide Modal */}
      {showHelp && csvColumns.length > 0 && (
        <div className="card mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">CSV Column Guide</h3>
            <button 
              onClick={() => setShowHelp(false)}
              className="text-white/50 hover:text-white"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-3 text-white/50">Column</th>
                  <th className="text-left py-2 px-3 text-white/50">Required</th>
                  <th className="text-left py-2 px-3 text-white/50">Description</th>
                  <th className="text-left py-2 px-3 text-white/50">Example</th>
                </tr>
              </thead>
              <tbody>
                {csvColumns.map((col, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-2 px-3 text-primary font-mono">{col.name}</td>
                    <td className="py-2 px-3">
                      {col.required ? (
                        <span className="text-success">Yes</span>
                      ) : (
                        <span className="text-white/50">No</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-white/70">{col.description}</td>
                    <td className="py-2 px-3 text-white/50 font-mono text-xs">{col.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Form */}
      <div className="card">
        <div className="space-y-4">
          {/* Quiz Name */}
          <div>
            <label className="block text-white/70 text-sm mb-2">
              Quiz Name *
            </label>
            <input
              type="text"
              value={quizName}
              onChange={(e) => setQuizName(e.target.value)}
              placeholder="e.g., Mathematics Final"
              className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none"
            />
          </div>

          {/* Quiz Description */}
          <div>
            <label className="block text-white/70 text-sm mb-2">
              Description (optional)
            </label>
            <textarea
              value={quizDescription}
              onChange={(e) => setQuizDescription(e.target.value)}
              placeholder="Brief description of this quiz..."
              rows={2}
              className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none resize-none"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-white/70 text-sm mb-2">
              Select File *
            </label>
            <div 
              className={`
                border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                ${selectedFile 
                  ? 'border-success bg-success/10' 
                  : 'border-white/20 hover:border-primary hover:bg-primary/5'}
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  {selectedFile.name.endsWith('.json') ? (
                    <FileJson className="w-12 h-12 text-success" />
                  ) : (
                    <FileSpreadsheet className="w-12 h-12 text-success" />
                  )}
                  <p className="text-white font-medium">{selectedFile.name}</p>
                  <p className="text-white/50 text-sm">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      resetForm();
                    }}
                    className="text-error text-sm hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-12 h-12 text-white/30" />
                  <p className="text-white/70">
                    Click to select or drag and drop
                  </p>
                  <p className="text-white/50 text-sm">
                    CSV or JSON files accepted
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={importing || !selectedFile || !quizName.trim()}
            className="w-full btn-primary flex items-center justify-center gap-2 py-4"
          >
            {importing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Import Questions
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className={`
            mt-6 p-4 rounded-xl animate-fade-in
            ${result.success ? 'bg-success/20' : 'bg-error/20'}
          `}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-error flex-shrink-0" />
              )}
              
              <div className="flex-1">
                <h4 className="text-white font-medium">
                  {result.success ? 'Import Successful!' : 'Import Completed with Issues'}
                </h4>
                
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-white/70">
                      Imported: <span className="text-success font-bold">{result.questions_imported}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-error" />
                    <span className="text-white/70">
                      Failed: <span className="text-error font-bold">{result.questions_failed}</span>
                    </span>
                  </div>
                </div>
                
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-3 p-3 bg-background rounded-lg">
                    <p className="text-white/50 text-xs mb-2">Errors:</p>
                    <ul className="space-y-1">
                      {result.errors.map((error, i) => (
                        <li key={i} className="text-error text-xs">
                          • {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* JSON Format Example */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileJson className="w-5 h-5 text-primary" />
          JSON Format Example
        </h3>
        <pre className="bg-background p-4 rounded-xl text-sm text-white/70 overflow-x-auto">
{`[
  {
    "topic": "Mathematics",
    "question_text": "What is 2 + 2?",
    "alternatives": ["3", "4", "5", "6"],
    "correct_answer": "4",
    "explanation": "Basic addition",
    "difficulty": 1
  },
  {
    "topic": "Science",
    "question_text": "What is H2O?",
    "alternatives": ["Water", "Fire", "Air", "Earth"],
    "correct_answer": "Water",
    "difficulty": 2
  }
]`}
        </pre>
      </div>
    </div>
  );
};

export default ImportQuestions;