import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@/pages/Dashboard";

interface AIInsightsProps {
  tasks: Task[];
}

export function AIInsights({ tasks }: AIInsightsProps) {
  const [insights, setInsights] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateInsights = async () => {
    setIsLoading(true);
    try {
      const pendingTasks = tasks.filter(task => !task.completed);
      const completedTasks = tasks.filter(task => task.completed);
      
      const { data, error } = await supabase.functions.invoke('generate-ai-insights', {
        body: { 
          pendingTasks: pendingTasks.length,
          completedTasks: completedTasks.length,
          tasks: pendingTasks.slice(0, 5).map(task => ({
            title: task.title,
            category: task.category,
            deadline: task.deadline
          }))
        }
      });

      if (error) throw error;
      
      if (data?.insights) {
        setInsights(data.insights);
      }
    } catch (error: any) {
      toast({
        title: "Error generating insights",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tasks.length > 0) {
      generateInsights();
    }
  }, [tasks.length]);

  const stats = {
    total: tasks.length,
    completed: tasks.filter(task => task.completed).length,
    pending: tasks.filter(task => !task.completed).length,
    overdue: tasks.filter(task => 
      !task.completed && 
      task.deadline && 
      new Date(task.deadline) < new Date()
    ).length,
  };

  return (
    <div className="space-y-6">
      {/* Task Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Task Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <div className="text-sm text-muted-foreground">Overdue</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-lg flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-primary" />
            AI Insights
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateInsights}
            disabled={isLoading || tasks.length === 0}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : insights ? (
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {insights}
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              Create some tasks to get AI insights!
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">
              Click refresh to generate insights
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}