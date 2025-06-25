'use client';

import { Question, UserAnswer } from '@/types/question';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Clock, RotateCcw, Home, Award } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface QuizResultsProps {
  questions: Question[];
  answers: UserAnswer[];
  timeSpent: number;
  onRetake: () => void;
}

export function QuizResults({ questions, answers, timeSpent, onRetake }: QuizResultsProps) {
  const router = useRouter();
  
  const totalScore = answers.reduce((sum, answer) => sum + answer.score, 0);
  const maxScore = questions.length;
  const percentage = Math.round((totalScore / maxScore) * 100);
  
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 90) return { label: 'Excellent', color: 'bg-green-500' };
    if (percentage >= 80) return { label: 'Good', color: 'bg-blue-500' };
    if (percentage >= 70) return { label: 'Average', color: 'bg-yellow-500' };
    if (percentage >= 60) return { label: 'Below Average', color: 'bg-orange-500' };
    return { label: 'Needs Improvement', color: 'bg-red-500' };
  };

  const scoreBadge = getScoreBadge(percentage);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Overall Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Quiz Results</CardTitle>
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <Badge className={`${scoreBadge.color} text-white`}>
                {scoreBadge.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
              <div className={`text-3xl font-bold ${getScoreColor(totalScore / maxScore)}`}>
                {totalScore.toFixed(1)}/{maxScore}
              </div>
              <p className="text-sm text-gray-600">Total Score</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg">
              <div className={`text-3xl font-bold ${getScoreColor(percentage / 100)}`}>
                {percentage}%
              </div>
              <p className="text-sm text-gray-600">Percentage</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-r from-teal-50 to-green-50 rounded-lg">
              <div className="text-3xl font-bold text-gray-700">
                {formatTime(timeSpent)}
              </div>
              <p className="text-sm text-gray-600">Time Spent</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-gray-600">{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Question-by-Question Results */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Detailed Results</h2>
        
        {questions.map((question, index) => {
          const answer = answers.find(a => a.questionId === question.id);
          if (!answer) return null;

          const isCorrect = answer.isCorrect;
          const scorePercentage = Math.round(answer.score * 100);

          return (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg flex items-start space-x-2">
                    <span className="min-w-fit">Question {index + 1}:</span>
                    <span className="leading-relaxed">{question.question}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <Badge variant={isCorrect ? "default" : "destructive"}>
                      {question.type === 'descriptive' ? `${scorePercentage}%` : isCorrect ? 'Correct' : 'Incorrect'}
                    </Badge>
                  </div>
                </div>
                <Badge variant="outline" className="w-fit">
                  {question.type === 'multiple_choice' ? 'Multiple Choice' : 'Descriptive'}
                </Badge>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {question.type === 'multiple_choice' ? (
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Your Answer: </span>
                      <span className={answer.selectedAnswer !== undefined ? 
                        (isCorrect ? 'text-green-600' : 'text-red-600') : 'text-gray-600'}>
                        {answer.selectedAnswer !== undefined ? 
                          question.options[answer.selectedAnswer] : 'No answer selected'}
                      </span>
                    </div>
                    {!isCorrect && (
                      <div>
                        <span className="font-medium">Correct Answer: </span>
                        <span className="text-green-600">
                          {question.correctAnswer !== null ? question.options[question.correctAnswer] : 'N/A'}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">Your Answer:</span>
                      <div className="mt-1 p-3 bg-gray-50 rounded border">
                        {answer.textAnswer || 'No answer provided'}
                      </div>
                    </div>
                    
                    {question.correctAnswerText && (
                      <div>
                        <span className="font-medium">Sample Correct Answer:</span>
                        <div className="mt-1 p-3 bg-green-50 rounded border">
                          {question.correctAnswerText}
                        </div>
                      </div>
                    )}
                    
                    {answer.keywordMatches && (
                      <div>
                        <span className="font-medium">Keyword Analysis:</span>
                        <div className="mt-1 space-y-1">
                          <div className="text-sm text-gray-600">
                            Matched {answer.keywordMatches.length} of {question.keywords.length} key concepts
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {question.keywords.map((keyword) => (
                              <Badge 
                                key={keyword}
                                variant={answer.keywordMatches?.includes(keyword) ? "default" : "outline"}
                                className={answer.keywordMatches?.includes(keyword) ? 
                                  "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                              >
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {question.explanation && (
                  <div className="pt-3 border-t">
                    <span className="font-medium">Explanation:</span>
                    <p className="mt-1 text-gray-700">{question.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          <Home className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <Button onClick={onRetake}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Retake Quiz
        </Button>
      </div>
    </div>
  );
}