import { useState } from 'react';
import { QuestionSet } from '@/types/question';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Download, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface QuestionSetCardProps {
  questionSet: QuestionSet;
  onDelete: () => void;
}

export function QuestionSetCard({ questionSet, onDelete }: QuestionSetCardProps) {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStartQuiz = () => {
    navigate(`/quiz/${questionSet.id}`);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify({ questions: questionSet.questions }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${questionSet.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Question set exported successfully!');
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'questionSets', questionSet.id));
      toast.success('Question set deleted successfully');
      onDelete();
    } catch (error) {
      console.error('Error deleting question set:', error);
      toast.error('Failed to delete question set');
    } finally {
      setIsDeleting(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <CardTitle className="text-lg line-clamp-2">{questionSet.title}</CardTitle>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>{format(questionSet.createdAt, 'MMM dd, yyyy')}</span>
            </div>
          </div>
          <Badge className={getDifficultyColor(questionSet.difficulty)}>
            {questionSet.difficulty}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Genre:</span>
            <span className="font-medium">{questionSet.genre}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Questions:</span>
            <span className="font-medium">{questionSet.totalQuestions}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Types:</span>
            <span className="font-medium">
              {questionSet.questions.some(q => q.type === 'multiple_choice') && 
               questionSet.questions.some(q => q.type === 'descriptive') 
                ? 'Mixed' 
                : questionSet.questions[0]?.type === 'multiple_choice' 
                  ? 'Multiple Choice' 
                  : 'Descriptive'}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={handleStartQuiz} className="flex-1">
            <Play className="w-4 h-4 mr-2" />
            Start Quiz
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4" />
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={isDeleting}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the question set
                  "{questionSet.title}" and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}