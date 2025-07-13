import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles } from "lucide-react";
import type { Task } from "@/pages/Dashboard";

interface TaskFormProps {
  task?: Task | null;
  onTaskCreated: (task: Task) => void;
  onTaskUpdated: (task: Task) => void;
}

const categories = [
  { value: 'personal', label: 'Personal' },
  { value: 'work', label: 'Work' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'health', label: 'Health' },
  { value: 'finance', label: 'Finance' },
  { value: 'education', label: 'Education' },
  { value: 'social', label: 'Social' },
];

export function TaskForm({ task, onTaskCreated, onTaskUpdated }: TaskFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingCategory, setIsGeneratingCategory] = useState(false);
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    category: task?.category || 'personal',
    deadline: task?.deadline ? task.deadline.split('T')[0] : '',
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const taskData = {
        title: formData.title,
        description: formData.description || null,
        category: formData.category as Task['category'],
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
      };

      if (task) {
        // Update existing task
        const { data, error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', task.id)
          .select()
          .single();

        if (error) throw error;
        onTaskUpdated(data);
      } else {
        // Create new task
        const { data, error } = await supabase
          .from('tasks')
          .insert([{ ...taskData, user_id: (await supabase.auth.getUser()).data.user?.id }])
          .select()
          .single();

        if (error) throw error;
        onTaskCreated(data);
      }
    } catch (error: any) {
      toast({
        title: `Error ${task ? 'updating' : 'creating'} task`,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateCategory = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Enter a title first",
        description: "Please enter a task title before generating a category.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingCategory(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-task-category', {
        body: { 
          title: formData.title,
          description: formData.description 
        }
      });

      if (error) throw error;
      
      if (data?.category) {
        setFormData(prev => ({ ...prev, category: data.category as Task['category'] }));
        toast({
          title: "Category suggested!",
          description: `AI suggested: ${categories.find(c => c.value === data.category)?.label}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error generating category",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCategory(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter task title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter task description (optional)"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="category">Category</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateCategory}
            disabled={isGeneratingCategory}
          >
            {isGeneratingCategory ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            AI Suggest
          </Button>
        </div>
        <Select 
          value={formData.category} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as Task['category'] }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="deadline">Deadline</Label>
        <Input
          id="deadline"
          type="date"
          value={formData.deadline}
          onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {task ? 'Update Task' : 'Create Task'}
      </Button>
    </form>
  );
}