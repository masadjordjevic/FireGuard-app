export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type WeatherSnapshot = {
  temperatureC: number;
  humidityPercent: number;
  windSpeedKmh: number;
};

export type RiskAssessment = {
  riskLevel: RiskLevel;
  riskScore: number; // 0-6
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
// Each factor contributes 0-2 points; total 0-6 maps to LOW/MEDIUM/HIGH.
export function scoreRisk(weather: WeatherSnapshot): { riskLevel: RiskLevel; riskScore: number } {
  let score = 0;

  if (weather.temperatureC >= 30) score += 2;
  else if (weather.temperatureC >= 20) score += 1;

  if (weather.humidityPercent <= 30) score += 2;
  else if (weather.humidityPercent <= 50) score += 1;

  if (weather.windSpeedKmh >= 30) score += 2;
  else if (weather.windSpeedKmh >= 15) score += 1;

  const riskLevel: RiskLevel = score >= 4 ? "HIGH" : score >= 2 ? "MEDIUM" : "LOW";
  return { riskLevel, riskScore: score };
}

export async function assessFireRisk(latitude: number, longitude: number): Promise<RiskAssessment> {
  const weather = await fetchWeather(latitude, longitude);
  const { riskLevel, riskScore } = scoreRisk(weather);
  return { riskLevel, riskScore, weather };
}
