import { Route, Routes, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import RecommendationsPage from './pages/RecommendationsPage';
import DetailsPage from './pages/DetailsPage';
import PlansPage from './pages/PlansPage';
import { defaultInputs, defaultPlans, investmentOptions } from './data/mockData';

const horizonLabels = {
  '1-3': '1-3 years',
  '5-10': '5-10 years',
  '10+': '10+ years',
};

function parseYieldRate(estimatedYield) {
  const numericRate = Number(String(estimatedYield ?? '0').replace('%', ''));
  if (!Number.isFinite(numericRate)) {
    return 0;
  }
  return numericRate / 100;
}

function calculateAnnualProfitWithMonthlyContributions(principal, monthlyContribution, annualRate) {
  const safePrincipal = Math.max(0, principal);
  const safeMonthlyContribution = Math.max(0, monthlyContribution);
  const safeAnnualRate = Number.isFinite(annualRate) ? annualRate : 0;

  if (safeAnnualRate <= 0) {
    return 0;
  }

  const monthlyRate = safeAnnualRate / 12;
  const growthFactor = (1 + monthlyRate) ** 12;
  const futurePrincipal = safePrincipal * growthFactor;
  const futureContributions = safeMonthlyContribution * ((growthFactor - 1) / monthlyRate);
  const totalContributed = safePrincipal + safeMonthlyContribution * 12;

  return Math.max(0, futurePrincipal + futureContributions - totalContributed);
}

function App() {
  const [theme, setTheme] = useState('light');
  const [inputs, setInputs] = useState(defaultInputs);
  const [plans, setPlans] = useState(defaultPlans);
  const [lastUpdated, setLastUpdated] = useState('Not updated yet');
  const navigate = useNavigate();

  const recommendationByRisk = useMemo(() => {
    const matched = investmentOptions.find((option) => option.risk === inputs.riskComfort);
    return matched ?? investmentOptions[0];
  }, [inputs.riskComfort]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
  };

  const updateInputField = (field, value) => {
    setInputs((currentInputs) => ({
      ...currentInputs,
      [field]: value,
    }));
  };

  const markInputsUpdated = () => {
    setLastUpdated(new Date().toLocaleTimeString());
  };

  const addPlan = ({ title, optionName, timeHorizon, amountValue, monthlyContributionValue }) => {
    const safeAmount = Math.max(0, Number(amountValue) || 0);
    const safeMonthlyContribution = Math.max(0, Number(monthlyContributionValue) || 0);
    const matchedOption = investmentOptions.find((option) => option.name === optionName);
    const yieldRate = parseYieldRate(matchedOption?.estimatedYield);
    const expectedAnnualProfit = calculateAnnualProfitWithMonthlyContributions(
      safeAmount,
      safeMonthlyContribution,
      yieldRate
    );

    const nextPlan = {
      id: Date.now(),
      title,
      timeHorizon,
      amount: `$${safeAmount.toLocaleString()}`,
      option: optionName,
      monthlyContribution: `$${safeMonthlyContribution.toLocaleString()}`,
      expectedYield: `${(yieldRate * 100).toFixed(1)}%`,
      expectedAnnualProfit: `$${Math.round(expectedAnnualProfit).toLocaleString()}`,
      startedAt: new Date().toISOString(),
    };

    setPlans((currentPlans) => [nextPlan, ...currentPlans]);
  };

  const saveFromDashboard = () => {
    const amountValue = Number(inputs.investmentAmount || 0);
    const monthlyContributionValue = Number(inputs.monthlyContribution || 0);

    addPlan({
      title: `Dashboard Plan (${horizonLabels[inputs.timeHorizon] ?? 'Custom'})`,
      optionName: recommendationByRisk.name,
      timeHorizon: horizonLabels[inputs.timeHorizon] ?? inputs.timeHorizon,
      amountValue,
      monthlyContributionValue,
    });

    navigate('/plans');
  };

  const saveFromOption = (optionId) => {
    const selectedOption = investmentOptions.find((option) => option.id === optionId);
    if (!selectedOption) {
      return;
    }

    const amountValue = Number(inputs.investmentAmount || 0);
    const monthlyContributionValue = Number(inputs.monthlyContribution || 0);

    addPlan({
      title: `${selectedOption.name} Plan`,
      optionName: selectedOption.name,
      timeHorizon: horizonLabels[inputs.timeHorizon] ?? inputs.timeHorizon,
      amountValue,
      monthlyContributionValue,
    });

    navigate('/plans');
  };

  const removePlan = (id) => {
    setPlans((currentPlans) => currentPlans.filter((plan) => plan.id !== id));
  };

  const dashboardElement = (
    <DashboardPage
      inputs={inputs}
      onFieldChange={updateInputField}
      onUpdateInputs={markInputsUpdated}
      onSavePlan={saveFromDashboard}
      lastUpdated={lastUpdated}
      recommendationName={recommendationByRisk.name}
    />
  );

  return (
    <Layout theme={theme} onToggleTheme={toggleTheme}>
      <Routes>
        <Route path="/" element={dashboardElement} />
        <Route path="/dashboard" element={dashboardElement} />
        <Route
          path="/recommendations"
          element={
            <RecommendationsPage
              options={investmentOptions}
              preferredRisk={inputs.riskComfort}
              onSavePlan={saveFromOption}
            />
          }
        />
        <Route
          path="/details"
          element={<DetailsPage options={investmentOptions} onSavePlan={saveFromOption} />}
        />
        <Route
          path="/details/:optionId"
          element={<DetailsPage options={investmentOptions} onSavePlan={saveFromOption} />}
        />
        <Route
          path="/plans"
          element={
            <PlansPage
              plans={plans}
              options={investmentOptions}
              onAddPlan={addPlan}
              onRemovePlan={removePlan}
            />
          }
        />
        <Route path="*" element={dashboardElement} />
      </Routes>
    </Layout>
  );
}

export default App;
