import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { QuestionSet } from '@/types/question';
import { QuestionSetCard } from './QuestionSetCard';
import { CreateQuestionForm } from './CreateQuestionForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, BookOpen, Target, TrendingUp } from 'lucide-react';
import { ImportExportSection } from './ImportExportSection';

export function Dashboard() {
  const { user } = useAuth();
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (user) {
      loadQuestionSets();
    }
  }, [user]);

  const loadQuestionSets = async () => {
    if (!user) return;
    
    try {
      const q = query(
        collection(db, 'questionSets'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const sets: QuestionSet[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sets.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
        } as QuestionSet);
      });
      
      setQuestionSets(sets);
    } catch (error) {
      console.error('Error loading question sets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSetCreated = () => {
    setShowCreateForm(false);
    loadQuestionSets();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Question Sets</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{questionSets.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {questionSets.reduce((total, set) => total + set.totalQuestions, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {questionSets.filter(set => {
                const daysDiff = (new Date().getTime() - set.createdAt.getTime()) / (1000 * 3600 * 24);
                return daysDiff <= 7;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Sets created this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Create New Question Set */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Create New Question Set
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus className="w-4 h-4 mr-2" />
              {showCreateForm ? 'Cancel' : 'Create New'}
            </Button>
          </CardTitle>
          <CardDescription>
            Generate AI-powered questions for your test preparation
          </CardDescription>
        </CardHeader>
        {showCreateForm && (
          <CardContent>
            <CreateQuestionForm onSuccess={handleQuestionSetCreated} />
          </CardContent>
        )}
      </Card>

      {/* Import/Export Section */}
      <ImportExportSection onImportSuccess={loadQuestionSets} />

      {/* Question Sets List */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Your Question Sets</h2>
        {questionSets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No question sets yet</h3>
              <p className="text-gray-500 mb-4">Create your first AI-generated question set to get started!</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Set
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {questionSets.map((questionSet) => (
              <QuestionSetCard 
                key={questionSet.id} 
                questionSet={questionSet}
                onDelete={loadQuestionSets}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}