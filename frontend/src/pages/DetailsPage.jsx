import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function DetailsPage({ options, onSavePlan }) {
  const { optionId } = useParams();
  const navigate = useNavigate();

  const selectedOption = useMemo(() => {
    if (!optionId) {
      return options[0];
    }

    return options.find((option) => option.id === optionId) ?? options[0];
  }, [optionId, options]);

  if (!selectedOption) {
    return null;
  }

  return (
    <section className="section">
      <div className="section-card">
        <h1>Historical Yield Summary</h1>

        <label htmlFor="details-option" className="filter-label">
          Option
          <select
            id="details-option"
            value={selectedOption.id}
            onChange={(event) => navigate(`/details/${event.target.value}`)}
          >
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <p className="section-text">{selectedOption.blurb}</p>

        <h2 className="details-stats-heading">Statistics</h2>
        <div className="stat-list">
          <div className="stat">
            <div className="stat-label">3-Year Avg</div>
            <div className="stat-value">{selectedOption.estimatedYield}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Best Year</div>
            <div className="stat-value">{selectedOption.bestYear}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Worst Year</div>
            <div className="stat-value">{selectedOption.worstYear}</div>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Year</th>
                <th scope="col">Total Return</th>
              </tr>
            </thead>
            <tbody>
              {selectedOption.history.map((entry) => (
                <tr key={entry.year}>
                  <td>{entry.year}</td>
                  <td>{entry.totalReturn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="details-save-actions">
          <button
            type="button"
            className="button details-save-button"
            onClick={() => onSavePlan(selectedOption.id)}
          >
            Save This Option as Plan
          </button>
        </div>
      </div>
    </section>
  );
}

export default DetailsPage;
