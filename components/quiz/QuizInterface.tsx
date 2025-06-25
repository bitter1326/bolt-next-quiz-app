'use client';

import { useState, useEffect } from 'react';
import { Question, UserAnswer } from '@/types/question';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Clock, CheckCircle } from 'lucide-react';

interface QuizInterfaceProps {
  questions: Question[];
  onComplete: (answers: UserAnswer[]) => void;
}

export function QuizInterface({ questions, onComplete }: QuizInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, UserAnswer>>(new Map());
  const [startTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleMultipleChoiceAnswer = (selectedIndex: number) => {
    const isCorrect = selectedIndex === currentQuestion.correctAnswer;
    const answer: UserAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer: selectedIndex,
      isCorrect,
      score: isCorrect ? 1 : 0
    };
    
    setAnswers(new Map(answers.set(currentQuestion.id, answer)));
  };

  const handleDescriptiveAnswer = (text: string) => {
    const keywords = currentQuestion.keywords || [];
    const keywordMatches = keywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    
    const score = keywords.length > 0 ? keywordMatches.length / keywords.length : 0;
    const isCorrect = score >= 0.5; // Consider correct if 50% or more keywords match

    const answer: UserAnswer = {
      questionId: currentQuestion.id,
      textAnswer: text,
      isCorrect,
      score,
      keywordMatches
    };
    
    setAnswers(new Map(answers.set(currentQuestion.id, answer)));
  };

  const goToNext = () => {
    if (isLastQuestion) {
      // Complete the quiz
      const answersArray = Array.from(answers.values());
      onComplete(answersArray);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const hasAnswered = answers.has(currentQuestion.id);
  const currentAnswer = answers.get(currentQuestion.id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">
              Question {currentQuestionIndex + 1} of {questions.length}
            </CardTitle>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeElapsed)}</span>
              </div>
              {hasAnswered && <CheckCircle className="w-4 h-4 text-green-600" />}
            </div>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
      </Card>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl leading-relaxed">
            {currentQuestion.question}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              currentQuestion.type === 'multiple_choice' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-purple-100 text-purple-800'
            }`}>
              {currentQuestion.type === 'multiple_choice' ? 'Multiple Choice' : 'Descriptive'}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentQuestion.type === 'multiple_choice' ? (
            <RadioGroup 
              value={currentAnswer?.selectedAnswer?.toString()} 
              onValueChange={(value) => handleMultipleChoiceAnswer(parseInt(value))}
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <div className="space-y-2">
              <Label>Your Answer:</Label>
              <Textarea
                value={currentAnswer?.textAnswer || ''}
                onChange={(e) => handleDescriptiveAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={6}
                className="resize-none"
              />
              {currentQuestion.keywords && currentQuestion.keywords.length > 0 && (
                <p className="text-sm text-gray-600">
                  <strong>Hint:</strong> Your answer should include concepts related to: {' '}
                  {currentQuestion.keywords.join(', ')}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={goToPrevious}
          disabled={currentQuestionIndex === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        <div className="text-sm text-gray-600 flex items-center">
          {answers.size} of {questions.length} questions answered
        </div>
        
        <Button onClick={goToNext} disabled={!hasAnswered}>
          {isLastQuestion ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Quiz
            </>
          ) : (
            <>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}