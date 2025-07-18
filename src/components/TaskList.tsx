import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Edit2, Trash2, Calendar, Cloud, CheckCircle, X } from "lucide-react";
import { format } from "date-fns";
import type { Task } from "@/pages/Dashboard";
import { WeatherInfo } from "./WeatherInfo";
import { TaskInsights } from "./TaskInsights";

interface TaskListProps {
  tasks: Task[];
  onTaskUpdate: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskEdit: (task: Task) => void;
}

const categoryColors = {
  work: "bg-blue-500",
  personal: "bg-green-500",
  urgent: "bg-red-500",
  health: "bg-pink-500",
  finance: "bg-yellow-500",
  education: "bg-purple-500",
  social: "bg-indigo-500",
};

const categoryLabels = {
  work: "Work",
  personal: "Personal",
  urgent: "Urgent",
  health: "Health",
  finance: "Finance",
  education: "Education",
  social: "Social",
};

export function TaskList({ tasks, onTaskUpdate, onTaskDelete, onTaskEdit }: TaskListProps) {
  const { toast } = useToast();

  const handleToggleComplete = async (task: Task) => {
    const newStatus = !task.completed;
    
    // Show completion notification if marking as complete
    if (newStatus) {
      toast({
        title: "Task completed! 🎉",
        description: `Mark "${task.title}" as completed?`,
        action: (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => updateTaskStatus(task, true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Yes
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => updateTaskStatus(task, false)}
            >
              <X className="h-3 w-3 mr-1" />
              No
            </Button>
          </div>
        ),
        duration: 10000,
      });
    } else {
      // Directly update if marking as incomplete
      updateTaskStatus(task, false);
    }
  };

  const updateTaskStatus = async (task: Task, completed: boolean) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ completed })
        .eq('id', task.id)
        .select()
        .single();

      if (error) throw error;
      onTaskUpdate(data);
      
      if (completed) {
        toast({
          title: "Task completed successfully!",
          description: `"${task.title}" has been marked as completed.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error updating task",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      onTaskDelete(taskId);
    } catch (error: any) {
      toast({
        title: "Error deleting task",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-muted-foreground text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No tasks found</h3>
            <p>Create your first task to get started!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card key={task.id} className={`transition-all duration-200 hover:shadow-md ${
          task.completed ? 'opacity-75' : ''
        }`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => handleToggleComplete(task)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium text-foreground ${
                    task.completed ? 'line-through' : ''
                  }`}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className={`text-sm text-muted-foreground mt-1 ${
                      task.completed ? 'line-through' : ''
                    }`}>
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge 
                      variant="secondary" 
                      className={`text-white ${categoryColors[task.category]}`}
                    >
                      {categoryLabels[task.category]}
                    </Badge>
                    {task.deadline && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(task.deadline), 'MMM dd, yyyy')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onTaskEdit(task)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(task.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {task.deadline && <WeatherInfo deadline={task.deadline} />}
            <TaskInsights task={task} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}