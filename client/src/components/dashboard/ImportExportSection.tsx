import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportExportSectionProps {
  onImportSuccess: () => void;
}

export function ImportExportSection({ onImportSuccess }: ImportExportSectionProps) {
  const { user } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const [importTitle, setImportTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!importTitle.trim()) {
      toast.error('Please enter a title for the imported question set');
      return;
    }

    setIsImporting(true);

    try {
      const fileContent = await file.text();
      const jsonData = JSON.parse(fileContent);

      // Validate JSON structure
      if (!jsonData.questions || !Array.isArray(jsonData.questions)) {
        throw new Error('Invalid file format: missing questions array');
      }

      // Validate each question
      for (const question of jsonData.questions) {
        if (!question.id || !question.type || !question.question) {
          throw new Error('Invalid question format: missing required fields');
        }
        if (!['multiple_choice', 'descriptive'].includes(question.type)) {
          throw new Error('Invalid question type: must be multiple_choice or descriptive');
        }
      }

      // Determine genre and difficulty from questions or use defaults
      const genre = jsonData.genre || 'Imported Questions';
      const difficulty = jsonData.difficulty || 'medium';

      // Save to Firestore
      await addDoc(collection(db, 'questionSets'), {
        title: importTitle,
        genre,
        difficulty,
        questions: jsonData.questions,
        createdAt: new Date(),
        userId: user.uid,
        totalQuestions: jsonData.questions.length,
        imported: true
      });

      toast.success('Question set imported successfully!');
      setImportTitle('');
      onImportSuccess();
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error importing questions:', error);
      toast.error(error.message || 'Failed to import question set');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>Import Question Set</span>
        </CardTitle>
        <CardDescription>
          Upload a JSON file containing questions to import into your library
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            JSON file must contain a "questions" array with properly formatted question objects.
            Each question must have: id, type, question, and appropriate answer fields.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="import-title">Title for Imported Set</Label>
          <Input
            id="import-title"
            value={importTitle}
            onChange={(e) => setImportTitle(e.target.value)}
            placeholder="Enter a title for the imported question set"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="file-upload">Select JSON File</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="file-upload"
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={isImporting}
              ref={fileInputRef}
            />
            <Button 
              variant="outline" 
              disabled={isImporting || !importTitle.trim()}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p className="font-medium mb-2">Expected JSON format:</p>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`{
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "correctAnswerText": null,
      "explanation": "Explanation",
      "keywords": []
    }
  ]
}`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}