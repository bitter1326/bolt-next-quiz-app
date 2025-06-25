import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export interface QuestionGenerationRequest {
  genre: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  questionType: 'multiple_choice' | 'descriptive' | 'mixed';
}

export async function generateQuestions(request: QuestionGenerationRequest) {
  const prompt = `
Generate ${request.questionCount} ${request.difficulty} level questions about ${request.genre}.

${request.questionType === 'multiple_choice' 
  ? 'Generate only multiple choice questions with 4 options each.'
  : request.questionType === 'descriptive'
  ? 'Generate only descriptive (essay/short answer) questions.'
  : 'Generate a mix of multiple choice and descriptive questions.'
}

Return the response in this exact JSON format:
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "Question text here",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": 0,
      "correctAnswerText": null,
      "explanation": "Detailed explanation of the correct answer",
      "keywords": []
    },
    {
      "id": "q2",
      "type": "descriptive",
      "question": "Descriptive question text here",
      "options": [],
      "correctAnswer": null,
      "correctAnswerText": "Sample correct answer",
      "explanation": "Detailed explanation",
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }
  ]
}

For multiple choice questions:
- correctAnswer should be the index (0-3) of the correct option
- correctAnswerText should be null
- keywords should be empty array

For descriptive questions:
- correctAnswer should be null
- correctAnswerText should contain a sample correct answer
- keywords should contain 3-5 key terms that should appear in a correct answer
- options should be empty array

Make sure all questions are educational, appropriate, and well-structured.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean the response to extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }
    
    const jsonData = JSON.parse(jsonMatch[0]);
    return jsonData;
  } catch (error) {
    console.error('Error generating questions:', error);
    throw new Error('Failed to generate questions. Please try again.');
  }
}