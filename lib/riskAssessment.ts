import { DangerLevel } from "@/lib/incidentEnums";

// Reuse the same LOW/MODERATE/HIGH/EXTREME scale as Incident.dangerLevel —
// this is a weather-driven prediction of fire danger for a location, on the
// same severity scale a reporter uses to describe an actual incident.
export type RiskLevel = DangerLevel;

export type WeatherSnapshot = {
  temperatureC: number;
  humidityPercent: number;
  windSpeedKmh: number;
};

export type RiskAssessment = {
  riskLevel: RiskLevel;
  riskScore: number; // 0-6
  explanation: string;
  weather: WeatherSnapshot;
};

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

export async function fetchWeather(latitude: number, longitude: number): Promise<WeatherSnapshot> {
  const url = `${OPEN_METEO_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`;
  const res = await fetch(url, { next: { revalidate: 600 } });

  if (!res.ok) {
    throw new Error(`Weather API request failed with status ${res.status}`);
  }

  const data = await res.json();
  const current = data.current;

  return {
    temperatureC: current.temperature_2m,
    humidityPercent: current.relative_humidity_2m,
    windSpeedKmh: current.wind_speed_10m,
  };
}

// Simple heuristic: hot + dry + windy conditions push wildfire risk up.
// Each factor contributes 0-2 points; total 0-6 maps to LOW/MODERATE/HIGH/EXTREME.
export function scoreRisk(weather: WeatherSnapshot): { riskLevel: RiskLevel; riskScore: number } {
  let score = 0;

  if (weather.temperatureC >= 30) score += 2;
  else if (weather.temperatureC >= 20) score += 1;

  if (weather.humidityPercent <= 30) score += 2;
  else if (weather.humidityPercent <= 50) score += 1;

  if (weather.windSpeedKmh >= 30) score += 2;
  else if (weather.windSpeedKmh >= 15) score += 1;

  const riskLevel: RiskLevel = score >= 6 ? "EXTREME" : score >= 4 ? "HIGH" : score >= 2 ? "MODERATE" : "LOW";
  return { riskLevel, riskScore: score };
}

// Short, template-based explanation (no LLM call needed for MVP) — states the
// actual readings, then a level-specific sentence about fire spread danger.
const LEVEL_EXPLANATIONS: Record<RiskLevel, string> = {
  LOW: "Conditions are cool, humid, and calm enough that fire is unlikely to spread quickly.",
  MODERATE: "Conditions could let a fire spread if one starts, so normal caution is warranted.",
  HIGH: "Hot, dry, and/or windy conditions make rapid fire spread likely if something ignites.",
  EXTREME:
    "Extreme heat, dryness, and wind create severe fire danger — expect fast-moving, hard-to-control fire behavior.",
};

export function explainRisk(weather: WeatherSnapshot, riskLevel: RiskLevel): string {
  const conditions = `${Math.round(weather.temperatureC)}°C, ${Math.round(weather.humidityPercent)}% humidity, ${Math.round(
    weather.windSpeedKmh
  )} km/h wind`;
  return `Current conditions: ${conditions}. ${LEVEL_EXPLANATIONS[riskLevel]}`;
}

export async function assessFireRisk(latitude: number, longitude: number): Promise<RiskAssessment> {
  const weather = await fetchWeather(latitude, longitude);
  const { riskLevel, riskScore } = scoreRisk(weather);
  const explanation = explainRisk(weather, riskLevel);
  return { riskLevel, riskScore, explanation, weather };
}
