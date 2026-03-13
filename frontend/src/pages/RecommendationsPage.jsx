import { useMemo, useState } from 'react';
import LivePlanTrackers from '../components/LivePlanTrackers';
import RecommendationCard from '../components/RecommendationCard';

function RecommendationsPage({ options, preferredRisk, onSavePlan }) {
  const [riskFilter, setRiskFilter] = useState('all');

  const shownOptions = useMemo(() => {
    if (riskFilter === 'all') {
      return options;
    }
    return options.filter((option) => option.risk === riskFilter);
  }, [options, riskFilter]);

  return (
    <section className="section">
      <div className="section-card">
        <h1>Ranked Safe Options</h1>
        <p className="section-text">
          Preferred profile from dashboard: <strong>{preferredRisk}</strong>
        </p>

        <label htmlFor="risk-filter" className="filter-label">
          Filter by risk
          <select
            id="risk-filter"
            value={riskFilter}
            onChange={(event) => setRiskFilter(event.target.value)}
          >
            <option value="all">All levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        <div className="card-grid recommendations-grid">
          {shownOptions.map((option) => (
            <RecommendationCard key={option.id} option={option} onSavePlan={onSavePlan} />
          ))}
        </div>

        <LivePlanTrackers options={options} />

        {shownOptions.length === 0 ? (
          <p className="section-text" aria-live="polite">
            No options for this filter.
          </p>
        ) : null}
      </div>
    </section>
  );
}

export default RecommendationsPage;
