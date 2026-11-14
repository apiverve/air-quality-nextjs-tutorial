// US EPA AQI from a PM2.5 reading (µg/m³), using the 2024 breakpoints.
// The API's own AQI is a paid field; this lets a free key still show a score and a colour.
const PM25: [number, number, number, number][] = [
  [0, 9, 0, 50],
  [9.1, 35.4, 51, 100],
  [35.5, 55.4, 101, 150],
  [55.5, 125.4, 151, 200],
  [125.5, 225.4, 201, 300],
  [225.5, 500, 301, 500]
];

export const LEVELS = [
  { max: 50, label: 'Good', color: '#2bb673' },
  { max: 100, label: 'Moderate', color: '#f2c12e' },
  { max: 150, label: 'Unhealthy for sensitive groups', color: '#f2862e' },
  { max: 200, label: 'Unhealthy', color: '#e5484d' },
  { max: 300, label: 'Very unhealthy', color: '#8e4ec6' },
  { max: 500, label: 'Hazardous', color: '#7a1f3d' }
];

export function aqiFromPm25(pm: number) {
  const c = Math.floor(pm * 10) / 10;
  const row = PM25.find(([lo, hi]) => c >= lo && c <= hi) || PM25[PM25.length - 1];
  const [lo, hi, aLo, aHi] = row;
  return Math.round(((aHi - aLo) / (hi - lo)) * (Math.min(c, hi) - lo) + aLo);
}

export const level = (aqi: number) => LEVELS.find((l) => aqi <= l.max) || LEVELS[LEVELS.length - 1];
