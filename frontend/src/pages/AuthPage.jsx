import { useState } from 'react';
import { fetchAuthenticatedUser, loginUser, registerUser } from '../services/authApi';

function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isRegisterMode = mode === 'register';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (isRegisterMode && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const authResult = isRegisterMode
        ? await registerUser(email, password)
        : await loginUser(email, password);

      const profileResult = await fetchAuthenticatedUser(authResult.token);
      onAuthSuccess({
        token: authResult.token,
        user: profileResult?.user || authResult.user,
      });

      setPassword('');
      setConfirmPassword('');
    } catch (submitError) {
      setError(submitError.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section">
      <div className="section-card auth-card">
        <h1>{isRegisterMode ? 'Create Account' : 'Welcome Back'}</h1>
        <p className="section-text">
          {isRegisterMode
            ? 'Register with email + password. Passwords are hashed on the server.'
            : 'Log in to access your dashboard, recommendations, and plans.'}
        </p>

        <div className="auth-mode-toggle" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            className={`auth-mode-button ${!isRegisterMode ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-mode-button ${isRegisterMode ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        <form className="form auth-form" onSubmit={handleSubmit}>
          <div className="form-grid auth-form-grid">
            <label htmlFor="auth-email">
              Email
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <label htmlFor="auth-password">
              Password
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                required
                minLength={8}
              />
            </label>

            {isRegisterMode ? (
              <label htmlFor="auth-confirm-password">
                Confirm Password
                <input
                  id="auth-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </label>
            ) : null}
          </div>

          {error ? (
            <p className="auth-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="form-actions">
            <button type="submit" className="button" disabled={loading}>
              {loading ? 'Please wait...' : isRegisterMode ? 'Register' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default AuthPage;
