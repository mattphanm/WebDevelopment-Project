import { useId, useState } from 'react';

function DashboardPage({
  inputs,
  onFieldChange,
  onUpdateInputs,
  onSavePlan,
  recommendationName,
}) {
  const [planNameInput, setPlanNameInput] = useState('');
  const [showPlanNamePrompt, setShowPlanNamePrompt] = useState(false);

  const timeHorizonId = useId();
  const amountId = useId();
  const riskId = useId();
  const contributionFrequencyId = useId();
  const monthlyContributionId = useId();
  const planNameId = useId();

  const submitPlanSave = () => {
    const customName = planNameInput.trim();
    onSavePlan(customName);
    setPlanNameInput('');
    setShowPlanNamePrompt(false);
  };

  return (
    <section className="section">
      <div className="section-card">
        <h1>Investment Inputs</h1>
        <p className="section-text">
          Update your profile to refresh the recommended option and save plans.
        </p>

        <div className="dashboard-layout">
          <form
            className="form dashboard-form"
            onSubmit={(event) => {
              event.preventDefault();
              onUpdateInputs();
            }}
          >
            <div className="form-grid dashboard-form-grid">
              <label htmlFor={timeHorizonId}>
                Time horizon
                <select
                  id={timeHorizonId}
                  value={inputs.timeHorizon}
                  onChange={(event) => onFieldChange('timeHorizon', event.target.value)}
                >
                  <option value="1-3">1-3 years</option>
                  <option value="5-10">5-10 years</option>
                  <option value="10+">10+ years</option>
                </select>
              </label>

              <label htmlFor={amountId}>
                Investment amount
                <input
                  id={amountId}
                  type="number"
                  min="0"
                  step="100"
                  value={inputs.investmentAmount}
                  onChange={(event) => onFieldChange('investmentAmount', event.target.value)}
                />
              </label>

              <label htmlFor={riskId}>
                Risk comfort
                <select
                  id={riskId}
                  value={inputs.riskComfort}
                  onChange={(event) => onFieldChange('riskComfort', event.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>

              <label htmlFor={contributionFrequencyId}>
                Contribution frequency
                <select
                  id={contributionFrequencyId}
                  value={inputs.contributionFrequency}
                  onChange={(event) => onFieldChange('contributionFrequency', event.target.value)}
                >
                  <option value="one-time">One-time</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </label>

              <label htmlFor={monthlyContributionId}>
                Monthly contribution
                <input
                  id={monthlyContributionId}
                  type="number"
                  min="0"
                  step="50"
                  value={inputs.monthlyContribution}
                  onChange={(event) => onFieldChange('monthlyContribution', event.target.value)}
                />
              </label>

              <div className="form-actions dashboard-form-actions">
                <button className="button" type="submit">
                  Update Inputs
                </button>
                <button
                  className="button ghost-button"
                  type="button"
                  onClick={() => setShowPlanNamePrompt(true)}
                >
                  Save as Plan
                </button>
              </div>
            </div>
          </form>

          <aside className="dashboard-status">
            <div className="stat-list dashboard-stat-list" aria-live="polite">
              <div className="stat">
                <div className="stat-label">Top Match</div>
                <div className="stat-value stat-value-small">{recommendationName}</div>
              </div>
            </div>
            {showPlanNamePrompt ? (
              <div className="dashboard-save-prompt" role="dialog" aria-modal="true" aria-label="Name your plan">
                <label htmlFor={planNameId}>
                  Plan name
                  <input
                    id={planNameId}
                    type="text"
                    value={planNameInput}
                    onChange={(event) => setPlanNameInput(event.target.value)}
                    placeholder="My dashboard plan"
                    autoFocus
                  />
                </label>
                <div className="form-actions">
                  <button className="button" type="button" onClick={submitPlanSave}>
                    Save Plan
                  </button>
                  <button
                    className="button ghost-button"
                    type="button"
                    onClick={() => {
                      setShowPlanNamePrompt(false);
                      setPlanNameInput('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}

export default DashboardPage;
