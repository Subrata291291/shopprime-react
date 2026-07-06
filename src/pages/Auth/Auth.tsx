import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

type AuthMode = 'login' | 'register';

export default function Auth() {
  const { login, register, isLoggedIn, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    if (isLoggedIn) navigate('/my-account');
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError(mode === 'login' ? 'Please enter your username.' : 'Please choose a username.');
      return;
    }
    if (!password.trim() || password.length < 3) {
      setError('Password must be at least 3 characters.');
      return;
    }
    if (mode === 'register') {
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters for registration.');
        return;
      }
    }

    let success: boolean;
    if (mode === 'login') {
      success = await login(username, password);
    } else {
      success = await register(username, email, password);
    }

    if (success) {
      navigate('/my-account');
    } else {
      setError(
        mode === 'login'
          ? 'Invalid username or password. Try again.'
          : 'Registration failed. This username or email may already be taken.'
      );
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setError('');
    setPassword('');
  };

  return (
    <main className="auth-main">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-card-inner">
            {/* Logo / Brand */}
            <div className="auth-brand">
              <i className="bi bi-shop"></i>
              <span>ShopPrime</span>
            </div>

            {/* Tab toggle */}
            <div className="auth-tabs">
              <button
                className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => mode !== 'login' && toggleMode()}
              >
                Sign In
              </button>
              <button
                className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                onClick={() => mode !== 'register' && toggleMode()}
              >
                Register
              </button>
            </div>

            {error && (
              <div className="auth-error">
                <i className="bi bi-exclamation-circle-fill"></i>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
              <div className="auth-input-group">
                <i className="bi bi-person auth-input-icon"></i>
                <input
                  type="text"
                  placeholder={mode === 'login' ? 'Username or email' : 'Choose a username'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete={mode === 'login' ? 'username' : 'new-username'}
                />
              </div>

              {mode === 'register' && (
                <div className="auth-input-group">
                  <i className="bi bi-envelope auth-input-icon"></i>
                  <input
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              )}

              <div className="auth-input-group">
                <i className="bi bi-lock auth-input-icon"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'login' ? 'Password' : 'Create a password (min 6 chars)'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="auth-pw-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>

              {mode === 'login' && (
                <div className="auth-row">
                  <label className="auth-checkbox">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                    <span>Remember me</span>
                  </label>
                  <button type="button" className="auth-link-btn" tabIndex={-1}>
                    Forgot password?
                  </button>
                </div>
              )}

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="auth-spinner"></span>
                    {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  <>{mode === 'login' ? 'Sign In' : 'Create Account'}</>
                )}
              </button>
            </form>

            {mode === 'login' && (
              <div className="auth-divider">
                <span>or continue with</span>
              </div>
            )}

            {mode === 'login' && (
              <div className="auth-social">
                <button className="auth-social-btn" type="button">
                  <i className="bi bi-google"></i>
                </button>
                <button className="auth-social-btn" type="button">
                  <i className="bi bi-github"></i>
                </button>
                <button className="auth-social-btn" type="button">
                  <i className="bi bi-apple"></i>
                </button>
              </div>
            )}

            <div className="auth-footer-text">
              {mode === 'login' ? (
                <span>
                  Don't have an account?{' '}
                  <button type="button" className="auth-link-btn auth-toggle-btn" onClick={toggleMode}>
                    Sign up free
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{' '}
                  <button type="button" className="auth-link-btn auth-toggle-btn" onClick={toggleMode}>
                    Sign in
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
