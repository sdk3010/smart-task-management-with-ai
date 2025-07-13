import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, Cloud, Calendar } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Task Manager</h1>
          </div>
          <Link to="/auth">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6">
            Smart Task Management with AI
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Organize your tasks, get AI-powered insights, and stay ahead of weather conditions that might affect your deadlines.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-6">
                Start Managing Tasks
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Task Categorization</h3>
            <p className="text-muted-foreground">
              Let AI automatically suggest the best category for your tasks based on their content.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Cloud className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Weather Integration</h3>
            <p className="text-muted-foreground">
              Get weather information for your task deadlines to plan accordingly.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Organization</h3>
            <p className="text-muted-foreground">
              Filter, search, and organize your tasks with intuitive tools and insights.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 Task Manager. Built with AI and weather integration.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
