function getElapsedMonths(startedAt) {
  if (!startedAt) {
    return 0;
  }

  const startDate = new Date(startedAt);
  if (Number.isNaN(startDate.getTime())) {
    return 0;
  }

  const now = new Date();
  let months =
    (now.getFullYear() - startDate.getFullYear()) * 12 +
    (now.getMonth() - startDate.getMonth());

  if (now.getDate() < startDate.getDate()) {
    months -= 1;
  }

  return Math.max(0, months);
}

function PlanCard({ plan, onRemovePlan }) {
  const elapsedMonths = getElapsedMonths(plan.startedAt);
  const monthLabel = `${elapsedMonths} ${elapsedMonths === 1 ? 'month' : 'months'}`;

  return (
    <article className="card plan-card">
      <span className="plan-month-tracker" aria-label={`Plan age: ${monthLabel}`}>
        {monthLabel}
      </span>

      <h2>{plan.title}</h2>

      <p className="muted plan-line">
        <span className="plan-label">Time Horizon:</span>{' '}
        <span className="plan-value">{plan.timeHorizon}</span>
      </p>
      <p className="muted plan-line">
        <span className="plan-label">Amount:</span>{' '}
        <span className="plan-value">{plan.amount}</span>
      </p>
      <p className="muted plan-line">
        <span className="plan-label">Option:</span>{' '}
        <span className="plan-value">{plan.option}</span>
      </p>
      <p className="muted plan-line">
        <span className="plan-label">Monthly Contributions:</span>{' '}
        <span className="plan-value">{plan.monthlyContribution ?? '$0'}</span>
      </p>
      <p className="muted plan-line">
        <span className="plan-label">Expected Profit / Year ({plan.expectedYield ?? '0%'} plan rate):</span>{' '}
        <span className="plan-value">{plan.expectedAnnualProfit ?? '$0'}</span>
      </p>

      <button
        type="button"
        className="button danger-button"
        onClick={() => onRemovePlan(plan.id)}
      >
        Remove
      </button>
    </article>
  );
}

export default PlanCard;
