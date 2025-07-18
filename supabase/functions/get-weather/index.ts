import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openWeatherApiKey = Deno.env.get('OPENWEATHER_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { deadline, city = 'London' } = await req.json();

    if (!openWeatherApiKey) {
      throw new Error('OpenWeather API key not configured');
    }

    console.log(`Fetching weather for ${city} on deadline: ${deadline}`);

    // Get weather forecast for the specific date if deadline is in the future
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const timeDiff = deadlineDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    let response;
    if (daysDiff > 0 && daysDiff <= 5) {
      // Use 5-day forecast for future dates
      response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${openWeatherApiKey}&units=metric`
      );
      
      if (response.ok) {
        const forecastData = await response.json();
        // Find the forecast closest to the deadline
        const targetDate = deadlineDate.toISOString().split('T')[0];
        const forecast = forecastData.list.find((item: any) => 
          item.dt_txt.startsWith(targetDate)
        ) || forecastData.list[0];
        
        const weather = {
          temp: forecast.main.temp,
          description: forecast.weather[0].description,
          icon: forecast.weather[0].icon,
          humidity: forecast.main.humidity,
          windSpeed: forecast.wind.speed,
          date: forecast.dt_txt,
        };
        
        console.log('Weather forecast found:', weather);
        return new Response(JSON.stringify({ weather }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    // Fallback to current weather
    response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${openWeatherApiKey}&units=metric`
    );

    if (!response.ok) {
      throw new Error(`OpenWeather API error: ${response.statusText}`);
    }

    const weatherData = await response.json();

    const weather = {
      temp: weatherData.main.temp,
      description: weatherData.weather[0].description,
      icon: weatherData.weather[0].icon,
      humidity: weatherData.main.humidity,
      windSpeed: weatherData.wind.speed,
      location: weatherData.name,
      country: weatherData.sys.country,
    };

    console.log('Current weather found:', weather);

    return new Response(JSON.stringify({ weather }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-weather function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});