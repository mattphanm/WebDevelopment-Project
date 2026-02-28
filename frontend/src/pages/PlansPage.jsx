import { useId, useState } from 'react';
import PlanCard from '../components/PlanCard';

function PlansPage({ plans, options, onAddPlan, onRemovePlan }) {
  const [title, setTitle] = useState('');
  const [horizon, setHorizon] = useState('5-10 years');
  const [amount, setAmount] = useState('5000');
  const [monthlyContribution, setMonthlyContribution] = useState('250');
  const [optionName, setOptionName] = useState(options[0]?.name ?? '');

  const titleId = useId();
  const horizonId = useId();
  const amountId = useId();
  const monthlyContributionId = useId();
  const optionId = useId();

  return (
    <section className="section">
      <div className="section-card">
        <h1>Saved Plans</h1>
        <p className="section-text">
          Add and remove plans to simulate account-level persistence.
        </p>

        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault();
            const cleanTitle = title.trim() || 'Custom Plan';

            onAddPlan({
              title: cleanTitle,
              timeHorizon: horizon,
              optionName,
              amountValue: Number(amount || 0),
              monthlyContributionValue: Number(monthlyContribution || 0),
            });

            setTitle('');
            setAmount('5000');
            setMonthlyContribution('250');
          }}
        >
          <div className="form-grid plans-form-grid">
            <label htmlFor={titleId}>
              Plan title
              <input
                id={titleId}
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Income-focused plan"
              />
            </label>

            <label htmlFor={horizonId}>
              Time horizon
              <select id={horizonId} value={horizon} onChange={(event) => setHorizon(event.target.value)}>
                <option value="1-3 years">1-3 years</option>
                <option value="5-10 years">5-10 years</option>
                <option value="10+ years">10+ years</option>
              </select>
            </label>

            <label htmlFor={amountId}>
              Starting amount
              <input
                id={amountId}
                type="number"
                min="0"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>

            <label htmlFor={monthlyContributionId}>
              Monthly contribution
              <input
                id={monthlyContributionId}
                type="number"
                min="0"
                step="50"
                value={monthlyContribution}
                onChange={(event) => setMonthlyContribution(event.target.value)}
              />
            </label>

            <label htmlFor={optionId}>
              Investment option
              <select
                id={optionId}
                value={optionName}
                onChange={(event) => setOptionName(event.target.value)}
              >
                {options.map((option) => (
                  <option key={option.id} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="plans-add-action">
              <button className="button" type="submit">
                Add Plan
              </button>
            </div>
          </div>
        </form>

        <div className="card-grid plans-grid" aria-live="polite">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onRemovePlan={onRemovePlan} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default PlansPage;
