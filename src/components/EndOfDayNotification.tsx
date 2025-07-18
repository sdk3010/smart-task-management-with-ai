import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import type { Task } from "@/pages/Dashboard";

interface EndOfDayNotificationProps {
  tasks: Task[];
  onTaskUpdate: (task: Task) => void;
}

export function EndOfDayNotification({ tasks, onTaskUpdate }: EndOfDayNotificationProps) {
  const [showNotification, setShowNotification] = useState(false);
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [suggestions, setSuggestions] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    checkForEndOfDayTasks();
    
    // Check every hour if it's end of day (after 6 PM)
    const interval = setInterval(checkForEndOfDayTasks, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [tasks]);

  const checkForEndOfDayTasks = () => {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Show notification between 6 PM and 11 PM
    if (currentHour >= 18 && currentHour < 23) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaysTasksList = tasks.filter(task => {
        if (!task.deadline) return false;
        const taskDate = new Date(task.deadline);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
      });

      if (todaysTasksList.length > 0) {
        setTodaysTasks(todaysTasksList);
        setShowNotification(true);
      }
    }
  };

  const handleTaskCompletion = async (task: Task, isCompleted: boolean) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ completed: isCompleted })
        .eq('id', task.id)
        .select()
        .single();

      if (error) throw error;
      onTaskUpdate(data);

      if (!isCompleted) {
        // Generate AI suggestion for incomplete task
        generateSuggestion(task);
      }

      toast({
        title: isCompleted ? "Task marked as completed!" : "Task marked as incomplete",
        description: isCompleted 
          ? `Great job completing "${task.title}"!` 
          : `Don't worry, we'll help you complete "${task.title}" tomorrow.`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating task",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const generateSuggestion = async (task: Task) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-insights', {
        body: { 
          tasks: [task],
          customPrompt: `The user couldn't complete this task today: "${task.title}" (Category: ${task.category}). 
          Provide encouraging and specific suggestions on how to complete this task tomorrow. 
          Include time management tips and actionable steps. Keep it motivational and under 80 words.`
        }
      });

      if (error) throw error;
      
      if (data?.insights) {
        setSuggestions(prev => ({
          ...prev,
          [task.id]: data.insights
        }));
      }
    } catch (error) {
      console.error('Error generating suggestion:', error);
    }
  };

  if (!showNotification || todaysTasks.length === 0) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 z-50 shadow-lg border-primary">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Clock className="mr-2 h-5 w-5 text-primary" />
          End of Day Check-in
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          How did today go? Let's review your tasks:
        </p>
        
        {todaysTasks.map((task) => (
          <div key={task.id} className="space-y-2 p-3 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{task.title}</h4>
                <Badge variant="secondary" className="text-xs mt-1">
                  {task.category}
                </Badge>
              </div>
              <div className="flex items-center space-x-1">
                {task.completed ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
              </div>
            </div>
            
            {!task.completed && (
              <>
                <p className="text-xs text-muted-foreground mb-2">
                  Did you complete this task today?
                </p>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleTaskCompletion(task, true)}
                    className="flex-1"
                  >
                    Yes, Completed
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTaskCompletion(task, false)}
                    className="flex-1"
                  >
                    No, Incomplete
                  </Button>
                </div>
                
                {suggestions[task.id] && (
                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                    <strong>Tomorrow's Plan:</strong> {suggestions[task.id]}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotification(false)}
          >
            Close
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}