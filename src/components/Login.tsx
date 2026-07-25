import { Icon } from '../icons';
import { useStore } from '../store';
import { ROLES } from '../data';

export function Login() {
  const { s, L, ar, cn, setLoginRole, toggleLang, togglePw, signIn } = useStore();
  return (
    <div className="login-wrap">
      <button className="lang-fixed" onClick={toggleLang}>{ar ? 'English' : 'العربية'}</button>
      <div className="login-card">
        <div className="login-head">
          <div className="gold-rule" style={{ marginBottom: 20 }} />
          <img className="login-seal" src="assets/up-seal.png" alt="University of Palestine" />
          <div className="uni-name">{L.uni}</div>
          <div className="uni-tag">{L.tagline}</div>
          <div className="gold-rule" style={{ marginTop: 20 }} />
        </div>
        <div className="login-body">
          <div className="section-label">{L.selectRole}</div>
          <div className="role-grid">
            {ROLES.map((r) => (
              <button key={r} className={'role-tab' + (s.loginRole === r ? ' active' : '')} onClick={() => setLoginRole(r)}>{L['r_' + r]}</button>
            ))}
          </div>
          <label className="field-label">{L.email}</label>
          <input className="inp" style={{ marginBottom: 16 }} defaultValue={(s.loginRole === 'student' ? 'student' : s.loginRole) + '@up.edu.ps'} />
          <label className="field-label">{L.pwd}</label>
          <div className="pw-wrap">
            <input className="inp" type={s.showPw ? 'text' : 'password'} defaultValue="············" style={{ paddingInlineEnd: 44 }} />
            <button className="pw-toggle" onClick={togglePw}><Icon name={s.showPw ? 'eyeoff' : 'eye'} size={18} /></button>
          </div>
          <div className="row-between" style={{ marginBottom: 20 }}>
            <label className="checkbox-lbl"><input type="checkbox" defaultChecked />{L.remember}</label>
            <a href="#" className="link-peach" onClick={(e) => e.preventDefault()}>{L.forgot}</a>
          </div>
          <button className="btn-primary" onClick={signIn}>
            {s.loginLoading && <span className="spinner" />}
            {s.loginLoading ? cn('Signing in…', 'جارٍ الدخول…') : L.signIn}
          </button>
          <div className="login-foot">{L.footer}<br />© 2026 {L.uni} · {L.tagline}</div>
        </div>
      </div>
    </div>
  );
}
