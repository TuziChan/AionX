import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export function Component() {
  const navigate = useNavigate();
  const location = useLocation();
  const status = useAuthStore((state) => state.status);
  const login = useAuthStore((state) => state.login);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const targetPath = useMemo(() => {
    return (location.state as { from?: string } | null)?.from || '/guid';
  }, [location.state]);

  useEffect(() => {
    if (status === 'authenticated') {
      navigate(targetPath, { replace: true });
    }
  }, [navigate, status, targetPath]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const result = await login({
      username,
      password,
      remember: rememberMe,
    });

    setSubmitting(false);

    if (!result.success) {
      setMessage({
        type: 'error',
        text: result.message || '登录失败，请检查输入。',
      });
      return;
    }

    setMessage({
      type: 'success',
      text: '已登录，正在进入工作区。',
    });
    navigate(targetPath, { replace: true });
  };

  return (
    <div className="login-page">
      <div className="login-page__background" aria-hidden="true">
        <div className="login-page__background-circle login-page__background-circle--lg" />
        <div className="login-page__background-circle login-page__background-circle--md" />
        <div className="login-page__background-circle login-page__background-circle--sm" />
      </div>

      <div className="login-page__card">
        <div className="login-page__header">
          <div className="login-page__logo">
            <div className="app-mark app-mark--hero" aria-hidden="true">
              <svg viewBox="0 0 80 80" fill="none">
                <path d="M40 20Q38 22 25 40Q23 42 26 42H30Q32 40 40 30Q48 40 50 42H54Q57 42 55 40Q42 22 40 20Z" fill="currentColor" />
                <circle cx="40" cy="46" r="3" fill="currentColor" />
                <path d="M18 50Q40 70 62 50" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <h1 className="login-page__title">AionX</h1>
          <p className="login-page__subtitle">与 AionUi 视觉基线对齐的桌面智能工作台</p>
        </div>

        <form className="login-page__form" onSubmit={handleSubmit}>
          <div className="login-page__form-item">
            <label className="login-page__label" htmlFor="username">
              用户名
            </label>
            <div className="login-page__input-wrapper">
              <input
                id="username"
                className="login-page__input"
                placeholder="victory"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="login-page__form-item">
            <label className="login-page__label" htmlFor="password">
              密码
            </label>
            <div className="login-page__input-wrapper">
              <input
                id="password"
                type={passwordVisible ? 'text' : 'password'}
                className="login-page__input"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-page__toggle-password"
                onClick={() => setPasswordVisible((prev) => !prev)}
              >
                {passwordVisible ? '隐藏' : '显示'}
              </button>
            </div>
          </div>

          <div className="login-page__checkbox">
            <input
              type="checkbox"
              id="remember-me"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            <label htmlFor="remember-me">记住登录状态</label>
          </div>

          <button type="submit" className="login-page__submit" disabled={submitting}>
            <span>{submitting ? '登录中…' : '进入 AionX'}</span>
          </button>

          <div
            role="alert"
            aria-live="polite"
            className={`login-page__message ${message ? 'login-page__message--visible' : ''} ${
              message ? (message.type === 'success' ? 'login-page__message--success' : 'login-page__message--error') : ''
            }`}
            hidden={!message}
          >
            {message?.text}
          </div>
        </form>

        <div className="login-page__footer">
          <div className="login-page__footer-content">
            <span>Screenshot-ready Shell</span>
            <span className="login-page__footer-divider">•</span>
            <span>Guide / Conversation / Settings / Cron</span>
          </div>
        </div>
      </div>
    </div>
  );
}

Component.displayName = 'LoginPage';
