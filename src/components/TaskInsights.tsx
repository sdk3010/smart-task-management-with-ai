import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@/pages/Dashboard";

interface TaskInsightsProps {
  task: Task;
}

export function TaskInsights({ task }: TaskInsightsProps) {
  const [insights, setInsights] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateTaskInsights = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const taskDeadline = task.deadline ? new Date(task.deadline) : null;
      const isOverdue = taskDeadline && taskDeadline < now && !task.completed;
      
      let prompt;
      
      if (isOverdue) {
        const daysOverdue = Math.floor((now.getTime() - taskDeadline.getTime()) / (1000 * 60 * 60 * 24));
        prompt = `⚠️ OVERDUE TASK RECOVERY PLAN ⚠️
        
        Task "${task.title}" is ${daysOverdue} day(s) overdue (deadline: ${taskDeadline.toLocaleDateString()})
        Category: ${task.category}
        Description: ${task.description || 'No description'}
        
        Provide urgent action steps to:
        1. How to catch up and complete this overdue task quickly
        2. Specific strategies to prioritize and tackle it today
        3. Ways to prevent similar delays in future
        4. Time-efficient completion methods for this category
        
        Keep response actionable and under 100 words.`;
      } else {
        prompt = `Analyze this task and provide specific insights:
        Title: ${task.title}
        Description: ${task.description || 'No description'}
        Category: ${task.category}
        Deadline: ${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
        Status: ${task.completed ? 'Completed' : 'Pending'}
        
        Provide:
        1. Priority assessment based on deadline and category
        2. Specific tips for completing this task efficiently
        3. Potential challenges and how to overcome them
        4. Time management suggestions
        
        Keep response concise (under 100 words) and actionable.`;
      }

      const { data, error } = await supabase.functions.invoke('generate-ai-insights', {
        body: { 
          pendingTasks: task.completed ? 0 : 1,
          completedTasks: task.completed ? 1 : 0,
          tasks: [{
            title: task.title,
            category: task.category,
            deadline: task.deadline,
            description: task.description
          }],
          customPrompt: prompt
        }
      });

      if (error) throw error;
      
      if (data?.insights) {
        setInsights(data.insights);
      }
    } catch (error: any) {
      toast({
        title: "Error generating task insights",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateTaskInsights();
  }, [task.id]);

  return (
    <Card className="mt-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm flex items-center">
          <Sparkles className="mr-1 h-4 w-4 text-primary" />
          AI Task Insights
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={generateTaskInsights}
          disabled={isLoading}
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        ) : insights ? (
          <div className="text-xs text-muted-foreground whitespace-pre-wrap">
            {insights}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-2">
            Click refresh to generate insights
          </div>
        )}
      </CardContent>
    </Card>
  );
}