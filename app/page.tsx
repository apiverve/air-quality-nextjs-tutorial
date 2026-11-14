'use client';

import { useEffect, useState } from 'react';
import { aqiFromPm25, level, LEVELS } from '@/lib/aqi';

type Air = {
  city: string;
  pm2_5: number;
  pm10: number;
  recommendation: string;
  // Paid fields: null or missing on a free key.
  aqi?: number | null;
  aqiCategory?: string | null;
  dominantPollutant?: string | null;
  ozone?: number | null;
  nitrogenDioxide?: number | null;
  sulfurdioxide?: number | null;
  carbonMonoxide?: number | null;
};

const SAVED_DEFAULT = ['London', 'Los Angeles', 'Singapore'];

// WHO 24-hour guideline levels (µg/m³), used to scale the bars.
const GUIDE: Record<string, [string, number]> = {
  pm2_5: ['PM2.5', 15],
  pm10: ['PM10', 45],
  ozone: ['Ozone', 100],
  nitrogenDioxide: ['NO₂', 25],
  sulfurdioxide: ['SO₂', 40]
};

function Gauge({ aqi, color }: { aqi: number; color: string }) {
  const pct = Math.min(aqi, 300) / 300;
  const r = 80;
  const len = Math.PI * r;
  return (
    <svg viewBox="0 0 200 120" className="gauge" aria-hidden>
      <path d="M20 100 A80 80 0 0 1 180 100" className="track" />
      <path d="M20 100 A80 80 0 0 1 180 100" className="fill" style={{ stroke: color, strokeDasharray: `${len * pct} ${len}` }} />
    </svg>
  );
}

export default function Home() {
  const [air, setAir] = useState<Air | null>(null);
  const [saved, setSaved] = useState<string[]>(SAVED_DEFAULT);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [missingKey, setMissingKey] = useState(false);
  const [loading, setLoading] = useState(false);

  async function load(place: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/air?city=${encodeURIComponent(place)}`);
      const body = await res.json();
      if (body.code === 'missing_key') return setMissingKey(true);
      if (!res.ok) throw new Error(body.error || 'Something went wrong');
      setAir(body);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let list = SAVED_DEFAULT;
    try { list = JSON.parse(localStorage.getItem('places') || 'null') || SAVED_DEFAULT; } catch {}
    setSaved(list);
    load(new URLSearchParams(location.search).get('city') || list[0]);
  }, []);

  function search(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    load(q);
    const next = [q, ...saved.filter((s) => s.toLowerCase() !== q.toLowerCase())].slice(0, 6);
    setSaved(next);
    try { localStorage.setItem('places', JSON.stringify(next)); } catch {}
    setQuery('');
  }

  if (missingKey) {
    return (
      <main className="shell">
        <section className="card missing">
          <h1>Add your API key</h1>
          <p>Air Quality needs an APIVerve key. Set <code>APIVERVE_API_KEY</code> in <code>.env</code>, or in your Vercel project&rsquo;s environment variables, then restart or redeploy.</p>
          <a href="https://dashboard.apiverve.com/signup?api=airquality" target="_blank" rel="noreferrer">Get a free key</a>
        </section>
      </main>
    );
  }

  // Use the official AQI when the plan includes it, otherwise work it out from PM2.5.
  const score = air ? air.aqi ?? aqiFromPm25(air.pm2_5) : 0;
  const lvl = level(score);
  const pollutants = air
    ? Object.entries(GUIDE).filter(([k]) => typeof air[k as keyof Air] === 'number')
    : [];

  return (
    <main className="shell" style={{ ['--level' as string]: lvl.color }}>
      <form className="search" onSubmit={search}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="City or US ZIP code" aria-label="City or ZIP code" />
        <button aria-label="Search">→</button>
      </form>

      <nav className="saved">
        {saved.map((s) => (
          <button key={s} className={air?.city?.toLowerCase() === s.toLowerCase() ? 'on' : ''} onClick={() => load(s)}>{s}</button>
        ))}
      </nav>

      {error && <p className="error">{error}</p>}

      {air && (
        <div className={`layout ${loading ? 'dim' : ''}`}>
          <section className="card hero">
            <p className="city">{air.city}</p>
            <div className="dial">
              <Gauge aqi={score} color={lvl.color} />
              <div className="score">
                <strong>{score}</strong>
                <span>AQI</span>
              </div>
            </div>
            <p className="label">{air.aqiCategory || lvl.label}</p>
            <p className="advice">{air.recommendation}</p>
          </section>

          <section className="card">
            <h2>Pollutants <small>µg/m³ · bar marks the WHO guideline</small></h2>
            <ul className="bars">
              {pollutants.map(([k, [name, guide]]) => {
                const v = air[k as keyof Air] as number;
                const pct = Math.min(v / (guide * 2), 1) * 100;
                return (
                  <li key={k} className={air.dominantPollutant === k ? 'main' : ''}>
                    <span className="name">{name}</span>
                    <span className="track"><i style={{ width: `${pct}%`, background: v > guide ? '#e5484d' : '#2bb673' }} /><b /></span>
                    <span className="val">{v}</span>
                  </li>
                );
              })}
            </ul>
            <ol className="scale">
              {LEVELS.map((l) => (
                <li key={l.label} style={{ background: l.color }} className={l === lvl ? 'here' : ''} title={l.label} />
              ))}
            </ol>
            <p className="scale-label"><span>Good</span><span>Hazardous</span></p>
          </section>
        </div>
      )}

      <footer className="foot">
        Readings from <a href="https://apiverve.com/marketplace/airquality" target="_blank" rel="noreferrer">APIVerve Air Quality</a>
      </footer>
    </main>
  );
}
