import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { QuestionSet, UserAnswer } from '@/types/question';
import { QuizInterface } from '@/components/quiz/QuizInterface';
import { QuizResults } from '@/components/quiz/QuizResults';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function QuizPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<UserAnswer[]>([]);
  const [startTime, setStartTime] = useState(Date.now());

  useEffect(() => {
    if (user && params.id) {
      loadQuestionSet();
    }
  }, [user, params.id]);

  const loadQuestionSet = async () => {
    try {
      const docRef = doc(db, 'questionSets', params.id as string);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setQuestionSet({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt.toDate(),
        } as QuestionSet);
        setStartTime(Date.now());
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error loading question set:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = async (answers: UserAnswer[]) => {
    if (!user || !questionSet) return;

    const timeSpent = Date.now() - startTime;
    const totalScore = answers.reduce((sum, answer) => sum + answer.score, 0);
    const maxScore = questionSet.questions.length;

    try {
      // Save quiz result to Firestore
      await addDoc(collection(db, 'quizResults'), {
        questionSetId: questionSet.id,
        userId: user.uid,
        answers,
        totalScore,
        maxScore,
        completedAt: new Date(),
        timeSpent
      });
    } catch (error) {
      console.error('Error saving quiz result:', error);
      // Continue to show results even if saving fails
    }

    setQuizAnswers(answers);
    setShowResults(true);
  };

  const handleRetake = () => {
    setShowResults(false);
    setQuizAnswers([]);
    setStartTime(Date.now());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!questionSet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Question Set Not Found</h1>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50 py-8">
      <div className="container mx-auto px-4">
        {!showResults ? (
          <>
            <div className="mb-6">
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{questionSet.title}</h1>
                <p className="text-gray-600">
                  {questionSet.genre} • {questionSet.difficulty.charAt(0).toUpperCase() + questionSet.difficulty.slice(1)} • {questionSet.totalQuestions} Questions
                </p>
              </div>
            </div>
            
            <QuizInterface 
              questions={questionSet.questions}
              onComplete={handleQuizComplete}
            />
          </>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Quiz Completed!</h1>
              <p className="text-gray-600">{questionSet.title}</p>
            </div>
            
            <QuizResults
              questions={questionSet.questions}
              answers={quizAnswers}
              timeSpent={Date.now() - startTime}
              onRetake={handleRetake}
            />
          </>
        )}
      </div>
    </div>
  );
}