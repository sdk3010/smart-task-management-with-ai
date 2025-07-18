import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { TaskList } from "@/components/TaskList";
import { TaskForm } from "@/components/TaskForm";
import { TaskFilters } from "@/components/TaskFilters";
import { AIInsights } from "@/components/AIInsights";
import { EndOfDayNotification } from "@/components/EndOfDayNotification";
import { Plus, LogOut, User, Moon, Sun } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

export type Task = {
  id: string;
  title: string;
  description?: string;
  category: 'work' | 'personal' | 'urgent' | 'health' | 'finance' | 'education' | 'social';
  deadline?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export type TaskFilters = {
  category?: Task['category'];
  completed?: boolean;
  search?: string;
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching tasks",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    }
  };

  const handleTaskCreated = (newTask: Task) => {
    setTasks([newTask, ...tasks]);
    setIsDialogOpen(false);
    toast({
      title: "Task created",
      description: "Your task has been created successfully.",
    });
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks(tasks.map(task => task.id === updatedTask.id ? updatedTask : task));
    setEditingTask(null);
    setIsDialogOpen(false);
    toast({
      title: "Task updated",
      description: "Your task has been updated successfully.",
    });
  };

  const handleTaskDeleted = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    toast({
      title: "Task deleted",
      description: "Your task has been deleted successfully.",
    });
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const filteredTasks = tasks.filter(task => {
    if (filters.category && task.category !== filters.category) return false;
    if (filters.completed !== undefined && task.completed !== filters.completed) return false;
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase()) && 
        !task.description?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Task Manager</h1>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Actions and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) setEditingTask(null);
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingTask ? 'Edit Task' : 'Create New Task'}
                    </DialogTitle>
                  </DialogHeader>
                  <TaskForm
                    task={editingTask}
                    onTaskCreated={handleTaskCreated}
                    onTaskUpdated={handleTaskUpdated}
                  />
                </DialogContent>
              </Dialog>

              <TaskFilters
                filters={filters}
                onFiltersChange={setFilters}
              />
            </div>

            {/* Task List */}
            <TaskList
              tasks={filteredTasks}
              onTaskUpdate={handleTaskUpdated}
              onTaskDelete={handleTaskDeleted}
              onTaskEdit={handleEditTask}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <AIInsights tasks={tasks} />
          </div>
        </div>
      </div>

      {/* End of Day Notification */}
      <EndOfDayNotification 
        tasks={tasks} 
        onTaskUpdate={handleTaskUpdated} 
      />
    </div>
  );
}