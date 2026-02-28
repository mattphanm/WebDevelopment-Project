import { Link } from 'react-router-dom';

function RecommendationCard({ option, onSavePlan }) {
  return (
    <article className="card rec-card">
      <h2 className="rec-card-title">{option.name}</h2>

      <div className="tag-list rec-card-tags" aria-label={`${option.name} tags`}>
        {option.tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>

      <p className="muted rec-card-meta">
        Estimated yield: {option.estimatedYield} · {option.volatility}
      </p>
      <p className="section-text rec-card-blurb">{option.blurb}</p>

      <div className="card-actions rec-card-actions">
        <Link className="button ghost-button rec-card-btn" to={`/details/${option.id}`}>
          Inspect Details
        </Link>
        <button
          type="button"
          className="button rec-card-btn"
          onClick={() => onSavePlan(option.id)}
        >
          Save Plan
        </button>
      </div>
    </article>
  );
}

export default RecommendationCard;
