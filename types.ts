export interface WeatherData {
  location: string;
  current: {
    temp: string;
    condition: string;
    humidity: string;
    wind: string;
    feelsLike?: string;
    description: string;
  };
  forecast: Array<{
    day: string;
    temp: string;
    condition: string;
  }>;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface WeatherResponse {
  data: WeatherData | null;
  rawText?: string;
  sources: GroundingChunk[];
  dataSource: 'Custom API' | 'Google Search';
  fallbackReason?: string;
}

export enum WeatherCondition {
  Sunny = 'Sunny',
  Cloudy = 'Cloudy',
  Rainy = 'Rainy',
  Snowy = 'Snowy',
  Stormy = 'Stormy',
  Clear = 'Clear',
  Foggy = 'Foggy',
  PartlyCloudy = 'Partly Cloudy',
  Mist = 'Mist'
}