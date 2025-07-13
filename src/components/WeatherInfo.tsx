import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, Wind } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface WeatherInfoProps {
  deadline: string;
}

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

export function WeatherInfo({ deadline }: WeatherInfoProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Only fetch weather if deadline is within 5 days
    if (daysUntilDeadline >= 0 && daysUntilDeadline <= 5) {
      fetchWeather();
    }
  }, [deadline]);

  const fetchWeather = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase.functions.invoke('get-weather', {
        body: { deadline }
      });

      if (fetchError) throw fetchError;
      
      if (data?.weather) {
        setWeather(data.weather);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getWeatherIcon = (iconCode: string) => {
    if (iconCode.includes('01')) return <Sun className="h-4 w-4" />;
    if (iconCode.includes('02') || iconCode.includes('03') || iconCode.includes('04')) return <Cloud className="h-4 w-4" />;
    if (iconCode.includes('09') || iconCode.includes('10') || iconCode.includes('11')) return <CloudRain className="h-4 w-4" />;
    if (iconCode.includes('13')) return <CloudSnow className="h-4 w-4" />;
    return <Cloud className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Badge variant="outline" className="text-xs">
        <Cloud className="h-3 w-3 mr-1 animate-pulse" />
        Loading weather...
      </Badge>
    );
  }

  if (error || !weather) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Badge variant="outline" className="flex items-center gap-1">
        {getWeatherIcon(weather.icon)}
        {Math.round(weather.temp)}°C
      </Badge>
      <span className="capitalize">{weather.description}</span>
      <div className="flex items-center gap-1">
        <Wind className="h-3 w-3" />
        {weather.windSpeed} m/s
      </div>
    </div>
  );
}