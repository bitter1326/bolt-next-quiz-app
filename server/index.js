const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.post('/api/generate-questions', async (req, res) => {
  try {
    const { genre, difficulty, questionCount, questionType } = req.body;

    const prompt = `
Generate ${questionCount} ${difficulty} level questions about ${genre}.

${questionType === 'multiple_choice' 
  ? 'Generate only multiple choice questions with 4 options each.'
  : questionType === 'descriptive'
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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean the response to extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from AI');
    }
    
    const jsonData = JSON.parse(jsonMatch[0]);
    res.json(jsonData);
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ 
      error: 'Failed to generate questions. Please try again.',
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});