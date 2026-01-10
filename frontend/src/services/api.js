/**
 * API Service for KnowMetrics
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    throw new ApiError(
      data.detail || data.message || 'An error occurred',
      response.status,
      data
    );
  }
  
  return data;
}

const api = {
  // ========== Quizzes ==========
  async getQuizzes() {
    const response = await fetch(`${API_BASE_URL}/quizzes`);
    return handleResponse(response);
  },

  async getQuiz(quizId) {
    const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`);
    return handleResponse(response);
  },

  async createQuiz(data) {
    const response = await fetch(`${API_BASE_URL}/quizzes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  async updateQuiz(quizId, data) {
    const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  async deleteQuiz(quizId, hardDelete = false) {
    const response = await fetch(
      `${API_BASE_URL}/quizzes/${quizId}?hard_delete=${hardDelete}`,
      { method: 'DELETE' }
    );
    return handleResponse(response);
  },

  async getQuizTopics(quizId) {
    const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/topics`);
    return handleResponse(response);
  },

  // ========== CSV/JSON Import ==========
  async downloadCsvTemplate() {
    const response = await fetch(`${API_BASE_URL}/quizzes/csv-template`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  },

  async getCsvColumns() {
    const response = await fetch(`${API_BASE_URL}/quizzes/csv-template/columns`);
    return handleResponse(response);
  },

  async importCsv(file, quizName, quizDescription = '') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('quiz_name', quizName);
    if (quizDescription) {
      formData.append('quiz_description', quizDescription);
    }
    
    const response = await fetch(`${API_BASE_URL}/quizzes/import-csv`, {
      method: 'POST',
      body: formData
    });
    return handleResponse(response);
  },

  async importJson(file, quizName, quizDescription = '') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('quiz_name', quizName);
    if (quizDescription) {
      formData.append('quiz_description', quizDescription);
    }
    
    const response = await fetch(`${API_BASE_URL}/quizzes/import-json`, {
      method: 'POST',
      body: formData
    });
    return handleResponse(response);
  },

  async exportQuiz(quizId, format = 'csv') {
    const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/export?format=${format}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz_${quizId}_questions.${format}`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  // ========== Questions ==========
  async getQuestions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/questions?${queryString}`);
    return handleResponse(response);
  },

  async getRandomQuestions(quizId, count = 10) {
    const response = await fetch(
      `${API_BASE_URL}/questions/random?quiz_id=${quizId}&count=${count}`
    );
    return handleResponse(response);
  },

  async getQuestion(questionId) {
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}`);
    return handleResponse(response);
  },

  async createQuestion(data) {
    const response = await fetch(`${API_BASE_URL}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  async createBulkQuestions(quizId, questions) {
    const response = await fetch(`${API_BASE_URL}/questions/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz_id: quizId, questions })
    });
    return handleResponse(response);
  },

  async updateQuestion(questionId, data) {
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  async deleteQuestion(questionId, hardDelete = false) {
    const response = await fetch(
      `${API_BASE_URL}/questions/${questionId}?hard_delete=${hardDelete}`,
      { method: 'DELETE' }
    );
    return handleResponse(response);
  },

  // ========== Sessions ==========
  async getSessions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/sessions?${queryString}`);
    return handleResponse(response);
  },

  async getSession(sessionId) {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`);
    return handleResponse(response);
  },

  async getSessionsSummary(quizId = null) {
    const query = quizId ? `?quiz_id=${quizId}` : '';
    const response = await fetch(`${API_BASE_URL}/sessions/summary${query}`);
    return handleResponse(response);
  },

  async startSession(quizId, numQuestions = null) {
    const data = { quiz_id: quizId };
    if (numQuestions) {
      data.num_questions = numQuestions;
    }
    
    const response = await fetch(`${API_BASE_URL}/sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  async submitAnswer(sessionId, questionId, userAnswer, timeSpent) {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_id: questionId,
        user_answer: userAnswer,
        time_spent: timeSpent
      })
    });
    return handleResponse(response);
  },

  async finishSession(sessionId) {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/finish`, {
      method: 'POST'
    });
    return handleResponse(response);
  },

  async deleteSession(sessionId) {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  },

  // ========== Analytics ==========
  async getDashboard() {
    const response = await fetch(`${API_BASE_URL}/analytics/dashboard`);
    return handleResponse(response);
  },

  async getPerformancePrediction(quizId, examQuestions, minScore) {
    const response = await fetch(
      `${API_BASE_URL}/analytics/prediction/${quizId}?exam_questions=${examQuestions}&min_score=${minScore}`
    );
    return handleResponse(response);
  },

  async getRetentionAnalysis(quizId) {
    const response = await fetch(`${API_BASE_URL}/analytics/retention/${quizId}`);
    return handleResponse(response);
  },

  async getAllTopicsAnalytics() {
    const response = await fetch(`${API_BASE_URL}/analytics/topics`);
    return handleResponse(response);
  }
};

export default api;
export { ApiError };
