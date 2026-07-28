import { FormEvent, useState } from 'react';
import { authApi } from '../api/auth';
import { ROLES } from '../data';
import { Icon } from '../icons';
import { useStore } from '../store';

export function Login() {
  const { s, L, ar, cn, setLoginRole, toggleLang, togglePw, signIn, toast } = useStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void signIn(identifier, password).catch(() => undefined);
  };

  const forgotPassword = async () => {
    if (!identifier.trim()) {
      toast(cn('Enter your email or ID first.', 'أدخل بريدك الإلكتروني أو رقمك أولاً.'));
      return;
    }
    try {
      await authApi.forgotPassword(identifier.trim());
      toast(
        cn(
          'If the account exists, reset instructions were issued.',
          'إذا كان الحساب موجوداً، فقد تم إصدار تعليمات الاستعادة.',
        ),
      );
    } catch {
      toast(cn('The request could not be completed.', 'تعذر إكمال الطلب.'));
    }
  };

  const errorMessage =
    s.loginError === 'INVALID_CREDENTIALS'
      ? cn('Invalid email/ID or password.', 'البريد أو الرقم أو كلمة المرور غير صحيحة.')
      : s.loginError === 'ACCOUNT_LOCKED'
        ? cn('Account temporarily locked. Try again in 15 minutes.', 'الحساب مقفل مؤقتاً. حاول بعد 15 دقيقة.')
        : cn('Sign-in failed. Please try again.', 'تعذر تسجيل الدخول. حاول مرة أخرى.');

  return (
    <div className="login-wrap">
      <button type="button" className="lang-fixed" onClick={toggleLang}>
        {ar ? 'English' : 'العربية'}
      </button>
      <div className="login-card">
        <div className="login-head">
          <div className="gold-rule" style={{ marginBottom: 20 }} />
          <img className="login-seal" src="assets/up-seal.png" alt="University of Palestine" />
          <div className="uni-name">{L.uni}</div>
          <div className="uni-tag">{L.tagline}</div>
          <div className="gold-rule" style={{ marginTop: 20 }} />
        </div>
        <form className="login-body" onSubmit={submit}>
          <div className="section-label">{L.selectRole}</div>
          <div className="role-grid">
            {ROLES.map((role) => (
              <button
                type="button"
                key={role}
                className={'role-tab' + (s.loginRole === role ? ' active' : '')}
                onClick={() => setLoginRole(role)}
              >
                {L['r_' + role]}
              </button>
            ))}
          </div>
          <label className="field-label" htmlFor="identifier">
            {L.email}
          </label>
          <input
            id="identifier"
            className="inp"
            style={{ marginBottom: 16 }}
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            autoComplete="username"
            required
            placeholder={(s.loginRole === 'student' ? 'student' : s.loginRole) + '@up.edu.ps'}
          />
          <label className="field-label" htmlFor="password">
            {L.pwd}
          </label>
          <div className="pw-wrap">
            <input
              id="password"
              className="inp"
              type={s.showPw ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              placeholder="••••••••••••"
              style={{ paddingInlineEnd: 44 }}
            />
            <button
              type="button"
              className="pw-toggle"
              onClick={togglePw}
              aria-label={cn('Toggle password visibility', 'إظهار أو إخفاء كلمة المرور')}
            >
              <Icon name={s.showPw ? 'eyeoff' : 'eye'} size={18} />
            </button>
          </div>
          <div className="row-between" style={{ marginBottom: 20 }}>
            <span />
            <button type="button" className="link-peach" onClick={() => void forgotPassword()}>
              {L.forgot}
            </button>
          </div>
          {s.loginError && (
            <div role="alert" className="form-error">
              {errorMessage}
            </div>
          )}
          <button type="submit" className="btn-primary" disabled={s.loginLoading}>
            {s.loginLoading && <span className="spinner" />}
            {s.loginLoading ? cn('Signing in…', 'جارٍ الدخول…') : L.signIn}
          </button>
          <div className="login-foot">
            {L.footer}
            <br />© 2026 {L.uni} · {L.tagline}
          </div>
        </form>
      </div>
    </div>
  );
}
