const API_BASE_URL = '/api';

export const generateQuestions = async (request: {
  genre: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  questionType: 'multiple_choice' | 'descriptive' | 'mixed';
}) => {
  const response = await fetch(`${API_BASE_URL}/generate-questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate questions');
  }

  return response.json();
};