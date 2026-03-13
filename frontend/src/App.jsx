import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import RecommendationsPage from './pages/RecommendationsPage';
import DetailsPage from './pages/DetailsPage';
import PlansPage from './pages/PlansPage';
import { defaultInputs, investmentOptions } from './data/mockData';

const horizonLabels = {
  '1-3': '1-3 years',
  '5-10': '5-10 years',
  '10+': '10+ years',
};

const SESSION_STORAGE_KEY = 'authSession';
const PLANS_STORAGE_KEY = 'savedPlans';

function getInitialSession() {
  const defaultSession = { token: '', user: null };

  if (typeof window === 'undefined') {
    return defaultSession;
  }

  const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return defaultSession;
  }

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.token !== 'string') {
      return defaultSession;
    }

    return {
      token: parsed.token,
      user: parsed.user ?? null,
    };
  } catch {
    return defaultSession;
  }
}

function getInitialPlans() {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(PLANS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

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
  const [plans, setPlans] = useState(getInitialPlans);
  const [lastUpdated, setLastUpdated] = useState('Not updated yet');
  const [session, setSession] = useState(getInitialSession);
  const navigate = useNavigate();
  const isAuthenticated = Boolean(session.token);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!session.token) {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
  }, [plans]);

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

  const saveFromDashboard = (planTitle = '') => {
    const amountValue = Number(inputs.investmentAmount || 0);
    const monthlyContributionValue = Number(inputs.monthlyContribution || 0);
    const cleanTitle = String(planTitle).trim();

    addPlan({
      title: cleanTitle || `Dashboard Plan (${horizonLabels[inputs.timeHorizon] ?? 'Custom'})`,
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

  const handleAuthSuccess = ({ token, user }) => {
    setSession({ token, user });
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setSession({ token: '', user: null });
    navigate('/auth');
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
    <Layout
      theme={theme}
      onToggleTheme={toggleTheme}
      isAuthenticated={isAuthenticated}
      currentUserEmail={session.user?.email || ''}
      onLogout={handleLogout}
    >
      {!isAuthenticated ? (
        <Routes>
          <Route path="/auth" element={<AuthPage onAuthSuccess={handleAuthSuccess} />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      ) : (
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
          <Route path="/auth" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={dashboardElement} />
        </Routes>
      )}
    </Layout>
  );
}

export default App;
