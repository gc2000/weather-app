import React from 'react';
import { WeatherData, WeatherCondition } from '../types';
import { 
  SunIcon, 
  CloudIcon, 
  CloudRainIcon, 
  CloudSnowIcon, 
  CloudLightningIcon, 
  WindIcon, 
  DropletsIcon 
} from './Icons';

interface WeatherCardProps {
  data: WeatherData;
}

const getWeatherIcon = (condition: string, className: string = "w-16 h-16") => {
  const c = condition.toLowerCase();
  if (c.includes('rain') || c.includes('drizzle')) return <CloudRainIcon className={className} />;
  if (c.includes('snow') || c.includes('ice') || c.includes('blizzard')) return <CloudSnowIcon className={className} />;
  if (c.includes('storm') || c.includes('thunder')) return <CloudLightningIcon className={className} />;
  if (c.includes('cloud') || c.includes('overcast')) return <CloudIcon className={className} />;
  if (c.includes('fog') || c.includes('mist')) return <CloudIcon className={className} />; // Reusing cloud for mist
  return <SunIcon className={className} />;
};

const getBackgroundGradient = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes('rain') || c.includes('drizzle')) return 'from-slate-700 to-slate-900';
    if (c.includes('snow')) return 'from-blue-200 to-slate-500';
    if (c.includes('storm')) return 'from-indigo-900 to-purple-900';
    if (c.includes('cloud')) return 'from-gray-400 to-slate-600';
    if (c.includes('clear') && (c.includes('night') || new Date().getHours() > 19)) return 'from-blue-900 to-black'; 
    return 'from-blue-400 to-blue-600'; // Default sunny
};

const WeatherCard: React.FC<WeatherCardProps> = ({ data }) => {
  const { current, location, forecast } = data;
  const gradient = getBackgroundGradient(current.condition);

  return (
    <div className={`w-full max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br ${gradient} text-white transition-all duration-500`}>
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{location}</h2>
            <p className="text-blue-100 text-lg mt-1 capitalize">{current.condition}</p>
          </div>
          <div className="animate-pulse-slow">
            {getWeatherIcon(current.condition, "w-20 h-20 text-yellow-300 drop-shadow-lg")}
          </div>
        </div>

        {/* Main Temp */}
        <div className="mt-8 flex items-baseline">
          <span className="text-8xl font-thin tracking-tighter">
            {current.temp.replace(/[^0-9.-]/g, '')}°
          </span>
          <div className="ml-4 text-blue-100">
             {current.feelsLike && <p>Feels like {current.feelsLike}</p>}
          </div>
        </div>
        
        <p className="mt-4 text-blue-50 text-sm leading-relaxed opacity-90">
            {current.description}
        </p>

        {/* Stats Grid */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center space-x-3 hover:bg-white/20 transition-colors">
            <DropletsIcon className="w-6 h-6 text-blue-200" />
            <div>
              <p className="text-xs text-blue-200 uppercase font-semibold">Humidity</p>
              <p className="text-xl font-medium">{current.humidity}</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center space-x-3 hover:bg-white/20 transition-colors">
            <WindIcon className="w-6 h-6 text-blue-200" />
            <div>
              <p className="text-xs text-blue-200 uppercase font-semibold">Wind</p>
              <p className="text-xl font-medium">{current.wind}</p>
            </div>
          </div>
        </div>

        {/* Forecast */}
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-blue-200 uppercase mb-4 tracking-wider">3-Day Forecast</h3>
          <div className="space-y-3">
            {forecast.map((day, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                <span className="w-1/3 font-medium">{day.day}</span>
                <div className="flex items-center space-x-2 text-blue-100 w-1/3 justify-center">
                    {getWeatherIcon(day.condition, "w-6 h-6")}
                    <span className="text-xs hidden sm:inline">{day.condition}</span>
                </div>
                <span className="w-1/3 text-right font-medium">{day.temp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
