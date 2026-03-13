import { useEffect, useMemo, useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

const trackedOptions = [
  {
    id: 'treasury-ladder',
    symbol: 'SGOV',
    fallbackName: 'Treasury Bond Ladder',
  },
  {
    id: 'index-portfolio',
    symbol: 'AOR',
    fallbackName: 'Balanced Index Portfolio',
  },
  {
    id: 'dividend-growth',
    symbol: 'SCHD',
    fallbackName: 'Dividend Growth Basket',
  },
];

const fallbackQuotes = {
  SGOV: { symbol: 'SGOV', name: 'Treasury Bond Ladder', price: 100.56, changePercent: 0.09 },
  AOR: { symbol: 'AOR', name: 'Balanced Index Portfolio', price: 60.44, changePercent: 0.37 },
  SCHD: { symbol: 'SCHD', name: 'Dividend Growth Basket', price: 82.15, changePercent: 0.38 },
};

function formatSignedPercent(value) {
  const normalized = Number(value) || 0;
  const sign = normalized >= 0 ? '+' : '';
  return `${sign}${normalized.toFixed(2)}%`;
}

function formatCurrency(value) {
  if (!Number.isFinite(value)) {
    return '—';
  }
  return `$${value.toFixed(2)}`;
}

async function fetchDailySnapshot() {
  const url = `${API_BASE}/api/market/daily-snapshot`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload?.quotes) || payload.quotes.length === 0) {
    throw new Error('Unexpected quote response');
  }

  return {
    updatedAt: String(payload.updatedAt || ''),
    quotes: payload.quotes
      .filter((item) => item?.symbol)
      .map((item) => ({
        symbol: String(item.symbol).toUpperCase(),
        price: Number(item.price),
        changePercent: Number(item.changePercent),
        name: item.name,
      })),
  };
}

function LivePlanTrackers({ options }) {
  const [quoteMap, setQuoteMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  const trackedView = useMemo(
    () =>
      trackedOptions.map((entry) => {
        const optionName =
          options.find((option) => option.id === entry.id)?.name ?? entry.fallbackName;
        const quote = quoteMap[entry.symbol] ?? null;
        return {
          id: entry.id,
          symbol: entry.symbol,
          optionName,
          quote,
        };
      }),
    [options, quoteMap]
  );

  async function refreshQuotes() {
    try {
      const snapshot = await fetchDailySnapshot();
      const quotes = snapshot.quotes;
      const mapped = quotes.reduce((accumulator, quote) => {
        accumulator[quote.symbol] = quote;
        return accumulator;
      }, {});
      setQuoteMap(mapped);
      setError('');
      setLastUpdated(snapshot.updatedAt || new Date().toLocaleDateString());
    } catch {
      setQuoteMap(fallbackQuotes);
      setError('Daily snapshot service unavailable. Showing local snapshot values.');
      setLastUpdated(new Date().toLocaleDateString());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshQuotes();
  }, []);

  return (
    <section className="plan-tracker-panel" aria-label="Daily plan trackers">
      <div className="plan-tracker-header-row">
        <div>
          <h2>Daily Plan Snapshot</h2>
          <p className="section-text">
            Treasury Bond Ladder, Balanced Index Portfolio, Dividend Growth Basket.
          </p>
        </div>
        <button type="button" className="button ghost-button" onClick={refreshQuotes}>
          Reload Snapshot
        </button>
      </div>

      {loading ? (
        <p className="plan-tracker-loading" role="status" aria-live="polite">
          Loading daily snapshot...
        </p>
      ) : null}

      {error ? (
        <p className="plan-tracker-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="plan-tracker-grid" role="list" aria-label="Daily tracker list">
        {trackedView.map((item) => {
          const quote = item.quote;
          const changePercent = quote?.changePercent;
          const trendClass = (changePercent ?? 0) >= 0 ? 'plan-tracker-up' : 'plan-tracker-down';

          return (
            <article key={item.id} className="card plan-tracker-card" role="listitem">
              <div className="plan-tracker-top-row">
                <span>{item.symbol}</span>
                <span className={trendClass}>
                  {Number.isFinite(changePercent) ? formatSignedPercent(changePercent) : '—'}
                </span>
              </div>
              <p className="plan-tracker-name">{item.optionName}</p>
              <p className="plan-tracker-price">{formatCurrency(quote?.price)}</p>
            </article>
          );
        })}
      </div>

      {lastUpdated ? <p className="muted plan-tracker-updated">Snapshot date: {lastUpdated}</p> : null}
    </section>
  );
}

export default LivePlanTrackers;
