import React, { useState, useEffect } from 'react';
import { getWeather } from './services/weatherService';
import { WeatherResponse } from './types';
import WeatherCard from './components/WeatherCard';
import { SearchIcon, MapPinIcon, ExternalLinkIcon } from './components/Icons';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weatherResponse, setWeatherResponse] = useState<WeatherResponse | null>(null);

  // Initial load
  useEffect(() => {
    // Optionally load a default location or just wait for user input
    // handleSearch("New York"); 
  }, []);

  const handleSearch = async (location: string) => {
    if (!location.trim()) return;
    setLoading(true);
    setError(null);
    setWeatherResponse(null);

    try {
      const data = await getWeather(location);
      setWeatherResponse(data);
    } catch (err: any) {
      setError("Unable to fetch weather data. Please check your API key or try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGeolocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          handleSearch(`${latitude},${longitude}`);
        },
        (err) => {
          setError("Location access denied or unavailable.");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[128px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[128px] pointer-events-none"></div>

      <div className="z-10 w-full max-w-2xl flex flex-col items-center gap-8">
        
        {/* Title */}
        <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-white to-blue-200 pb-2">
            SkyCast AI
            </h1>
            <p className="text-slate-400 mt-2 text-sm md:text-base">
                Real-time weather insights powered by Gemini
            </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="w-full max-w-md relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="text-slate-400 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
          </div>
          <input
            type="text"
            className="w-full pl-12 pr-12 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-slate-800 transition-all shadow-lg backdrop-blur-sm"
            placeholder="Search city or coordinates..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
          />
          <button
            type="button"
            onClick={handleGeolocation}
            className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer hover:text-blue-400 text-slate-400 transition-colors"
            title="Use current location"
            disabled={loading}
          >
            <MapPinIcon className="w-5 h-5" />
          </button>
        </form>

        {/* Content Area */}
        <div className="w-full min-h-[400px] flex items-center justify-center">
            {loading ? (
                <div className="flex flex-col items-center space-y-4 animate-pulse">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-medium">Consulting the clouds...</p>
                </div>
            ) : error ? (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-6 rounded-2xl text-center max-w-md">
                    <p>{error}</p>
                </div>
            ) : weatherResponse?.data ? (
                <div className="flex flex-col w-full items-center gap-6">
                    {/* Source Badge with Error Info */}
                    <div className="flex flex-col items-center gap-2">
                        <div className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border flex items-center gap-2 ${
                            weatherResponse.dataSource === 'Custom API' 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                        }`}>
                            {weatherResponse.dataSource === 'Custom API' && (
                                <span className="font-bold text-sm">✓</span>
                            )}
                            <span>Source: {weatherResponse.dataSource}</span>
                        </div>
                        
                        {weatherResponse.fallbackReason && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs px-3 py-1 rounded-md max-w-md text-center">
                                ⚠️ API Connection Failed: {weatherResponse.fallbackReason}
                            </div>
                        )}
                    </div>

                    <WeatherCard data={weatherResponse.data} />
                    
                    {/* Sources / Grounding */}
                    {weatherResponse.sources && weatherResponse.sources.length > 0 && (
                        <div className="w-full max-w-md bg-slate-800/30 rounded-xl p-4 backdrop-blur-sm border border-slate-700/30">
                            <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider font-semibold">Sources</p>
                            <div className="flex flex-wrap gap-2">
                                {weatherResponse.sources.map((chunk, idx) => (
                                    chunk.web?.uri ? (
                                        <a 
                                            key={idx} 
                                            href={chunk.web.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center space-x-1 text-xs text-blue-300 bg-blue-500/10 px-2 py-1 rounded hover:bg-blue-500/20 transition-colors truncate max-w-[200px]"
                                        >
                                            <span className="truncate">{chunk.web.title || new URL(chunk.web.uri).hostname}</span>
                                            <ExternalLinkIcon className="w-3 h-3 flex-shrink-0" />
                                        </a>
                                    ) : null
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : weatherResponse?.rawText ? (
                 <div className="w-full max-w-md bg-slate-800/50 p-6 rounded-3xl shadow-xl text-slate-200 leading-relaxed border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-2">Weather Report</h3>
                    <div className="flex flex-col items-start gap-2 mb-4">
                        <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border flex items-center gap-2 ${
                            weatherResponse.dataSource === 'Custom API' 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                        }`}>
                            {weatherResponse.dataSource === 'Custom API' && (
                                <span className="font-bold text-sm">✓</span>
                            )}
                            <span>Source: {weatherResponse.dataSource}</span>
                        </div>
                        {weatherResponse.fallbackReason && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs px-3 py-1 rounded-md">
                                ⚠️ API Connection Failed: {weatherResponse.fallbackReason}
                            </div>
                        )}
                    </div>
                    <p>{weatherResponse.rawText}</p>
                 </div>
            ) : (
                <div className="text-slate-500 text-center max-w-xs">
                    <p>Enter a city name or use your location to see the weather.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default App;