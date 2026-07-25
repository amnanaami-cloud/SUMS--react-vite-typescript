import { Icon } from '../icons';
import { useStore } from '../store';
import { NAMES, AVATAR } from '../data';

export function Topbar({ title }: { title: string }) {
  const { s, L, ar, cn, toggleLang, toast } = useStore();
  const nm = NAMES[s.role];
  return (
    <header className="topbar">
      <div>
        <div className="role-label">{L['r_' + s.role]}</div>
        <h1>{title}</h1>
      </div>
      <div className="top-actions">
        <button className="chip-btn" onClick={toggleLang}>{ar ? 'English' : 'العربية'}</button>
        <button className="icon-btn" onClick={() => toast(cn('No new notifications', 'لا توجد إشعارات جديدة'))}>
          <Icon name="bell" size={18} /><span className="bell-dot" />
        </button>
        <div className="avatar" style={{ width: 40, height: 40, fontSize: 14, background: AVATAR[s.role] }}>{nm[2]}</div>
      </div>
    </header>
  );
}
