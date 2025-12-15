import { GoogleGenAI } from "@google/genai";
import { WeatherResponse, GroundingChunk } from "../types";

const CUSTOM_API_BASE = "https://mytestfunctionappsg123.azurewebsites.net/api/httptrigger";

const getWeather = async (location: string): Promise<WeatherResponse> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }

  // Configuration
  const customApiUrl = `${CUSTOM_API_BASE}?city=${encodeURIComponent(location)}`;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelId = "gemini-2.5-flash";

  let rawApiData: string | null = null;
  let useSearchGrounding = false;
  let fallbackReason: string | undefined;

  // 1. Attempt to fetch from the Custom API
  try {
    // Azure functions can have "cold starts", so we allow a longer timeout (15s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); 
    
    console.log(`Fetching from: ${customApiUrl}`);

    const response = await fetch(customApiUrl, { 
        signal: controller.signal,
        mode: 'cors',
        cache: 'no-store', // Critical: Ensure we don't cache previous CORS failures
        headers: {
            'Accept': 'application/json'
        }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API Status: ${response.status} ${response.statusText}`);
    }
    rawApiData = await response.text();
  } catch (error: any) {
    useSearchGrounding = true;
    if (error.name === 'AbortError') {
        fallbackReason = "API Timed Out (15s)";
    } else if (error.message === 'Failed to fetch') {
        fallbackReason = "Network/CORS Error (Check Azure CORS settings)";
    } else {
        fallbackReason = error.message || "Unknown API Error";
    }
    console.warn("Custom Weather API failed:", error);
  }

  // 2. Construct the Prompt based on success or failure of the API
  const jsonStructure = `
    {
      "location": "City, Country",
      "current": {
        "temp": "temperature (e.g. 24°C)",
        "condition": "short description (e.g. Sunny, Rain)",
        "humidity": "percentage (e.g. 45%)",
        "wind": "speed (e.g. 15 km/h)",
        "feelsLike": "temperature (e.g. 26°C)",
        "description": "A short, friendly sentence about the current weather."
      },
      "forecast": [
        {
          "day": "Day name (e.g. Tomorrow, Monday)",
          "temp": "High/Low (e.g. 25°/18°)",
          "condition": "short description"
        },
        ... (2 more days)
      ]
    }
  `;

  let prompt = "";
  if (useSearchGrounding) {
    prompt = `
      Find the current weather and a 3-day forecast for ${location}.
      
      IMPORTANT: Provide the response as a valid JSON object string. Do not use Markdown formatting (no \`\`\`json blocks).
      The JSON object must have this exact structure:
      ${jsonStructure}
      
      If specific data is not found, make a reasonable estimate based on the search results.
    `;
  } else {
    prompt = `
      I have received raw weather data from an external API for the location: "${location}".
      
      Raw Data:
      ${rawApiData}

      The Raw Data JSON contains:
      - "temperature": Value in Celsius.
      - "humidity": Percentage value.
      - "description": Weather condition.
      - "city": Location name.

      IMPORTANT: Parse this raw data and transform it into a valid JSON object matching the structure below.
      Do not use Markdown formatting (no \`\`\`json blocks).
      
      Target JSON Structure:
      ${jsonStructure}
      
      Guidance:
      - Map "temperature" from raw data to "current.temp" (add °C).
      - Map "humidity" from raw data to "current.humidity" (add %).
      - Map "description" from raw data to "current.condition".
      - Generate a friendly "current.description" based on the condition.
      - Since the API does not provide wind, feelsLike, or forecast, generate reasonable realistic estimates for these fields based on the current temperature and condition provided.
    `;
  }

  try {
    // 3. Call Gemini
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        // Only use search grounding if the custom API failed
        tools: useSearchGrounding ? [{ googleSearch: {} }] : undefined,
      },
    });

    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];

    // 4. Parse the response
    let jsonString = text.trim();
    
    // Clean up potential markdown formatting from LLM
    if (jsonString.includes("```")) {
        jsonString = jsonString.replace(/```json/g, "").replace(/```/g, "");
    }

    // Robust extraction: find the outer-most JSON object to ignore conversational filler
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
        jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    }

    let weatherData = null;
    try {
      weatherData = JSON.parse(jsonString);
    } catch (e) {
      console.warn("Failed to parse weather JSON", e);
    }

    // 5. Prepare Sources
    let sources: GroundingChunk[] = [];
    if (useSearchGrounding) {
      sources = groundingChunks;
    } else {
      sources = [{
        web: {
          uri: customApiUrl,
          title: "Custom Weather API"
        }
      }];
    }

    const dataSource = useSearchGrounding ? 'Google Search' : 'Custom API';

    // If we failed to parse JSON but have text, return raw text or fallback
    if (!weatherData) {
      return {
        data: null,
        rawText: useSearchGrounding ? text : `API Data processed but JSON parsing failed. Interpretation: ${text}`,
        sources: sources,
        dataSource,
        fallbackReason
      };
    }

    return {
      data: weatherData,
      sources: sources,
      dataSource,
      fallbackReason
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export { getWeather };