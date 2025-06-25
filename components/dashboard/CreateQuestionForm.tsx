'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { generateQuestions } from '@/lib/gemini';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface CreateQuestionFormProps {
  onSuccess: () => void;
}

export function CreateQuestionForm({ onSuccess }: CreateQuestionFormProps) {
  const { user, incrementPromptCount, canUsePrompt } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    questionCount: 5,
    questionType: 'mixed' as 'multiple_choice' | 'descriptive' | 'mixed'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (!canUsePrompt) {
      toast.error('Monthly prompt limit reached (10/10). Try again next month.');
      return;
    }

    setIsGenerating(true);

    try {
      // Increment prompt count first
      const canProceed = await incrementPromptCount();
      if (!canProceed) {
        toast.error('Monthly prompt limit reached.');
        return;
      }

      const questionsData = await generateQuestions({
        genre: formData.genre,
        difficulty: formData.difficulty,
        questionCount: formData.questionCount,
        questionType: formData.questionType
      });

      // Save to Firestore
      await addDoc(collection(db, 'questionSets'), {
        title: formData.title || `${formData.genre} - ${formData.difficulty}`,
        genre: formData.genre,
        difficulty: formData.difficulty,
        questions: questionsData.questions,
        createdAt: new Date(),
        userId: user.uid,
        totalQuestions: questionsData.questions.length
      });

      toast.success('Question set created successfully!');
      onSuccess();
      
      // Reset form
      setFormData({
        title: '',
        genre: '',
        difficulty: 'medium',
        questionCount: 5,
        questionType: 'mixed'
      });
    } catch (error: any) {
      console.error('Error creating question set:', error);
      toast.error(error.message || 'Failed to create question set');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title (Optional)</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Custom title for your question set"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="genre">Subject/Genre</Label>
              <Input
                id="genre"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                placeholder="e.g., Mathematics, History, Science"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Difficulty Level</Label>
              <Select value={formData.difficulty} onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Question Type</Label>
              <Select value={formData.questionType} onValueChange={(value: any) => setFormData({ ...formData, questionType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Multiple Choice Only</SelectItem>
                  <SelectItem value="descriptive">Descriptive Only</SelectItem>
                  <SelectItem value="mixed">Mixed (Both Types)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Number of Questions: {formData.questionCount}</Label>
            <Slider
              value={[formData.questionCount]}
              onValueChange={([value]) => setFormData({ ...formData, questionCount: value })}
              max={20}
              min={3}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>3</span>
              <span>20</span>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isGenerating || !canUsePrompt} 
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Questions...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Questions
              </>
            )}
          </Button>
          
          {!canUsePrompt && (
            <p className="text-sm text-red-600 text-center">
              Monthly prompt limit reached. You can create more question sets next month.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}