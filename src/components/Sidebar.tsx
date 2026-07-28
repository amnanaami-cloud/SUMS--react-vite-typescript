import { Icon } from '../icons';
import { useStore } from '../store';
import { MENUS, AVATAR } from '../data';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}

export function Sidebar({ isOpen, onToggle, onNavigate }: SidebarProps) {
  const { s, L, ar, cn, nav, logout } = useStore();

  const displayName = s.user ? (ar ? s.user.nameAr : s.user.nameEn) : cn('SUMS User', 'مستخدم النظام');
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'SU';
  const identity = s.user?.universityId ?? s.user?.employeeId ?? L['r_' + s.role];

  const handleNavigation = (screenId: string) => {
    nav(screenId);
    onNavigate();
  };

  return (
    <aside className="sidebar" aria-label={ar ? 'القائمة الجانبية' : 'Sidebar'} aria-hidden={!isOpen}>
      <div className="sb-head">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={onToggle}
          aria-label={ar ? 'إغلاق القائمة الجانبية' : 'Close sidebar'}
          title={ar ? 'إغلاق القائمة الجانبية' : 'Close sidebar'}
        >
          <Icon name={ar ? 'chevron-right' : 'chevron-left'} size={18} />
        </button>

        <img src="assets/up-seal.png" alt={ar ? 'شعار جامعة فلسطين' : 'University seal'} />

        <div className="sb-brand-text">
          <div className="sb-title">{L.uni}</div>

          <div className="sb-sub">SUMS · {L['r_' + s.role]}</div>
        </div>
      </div>

      <nav className="sb-nav">
        {MENUS[s.role].map(([id, iconName]) => (
          <button
            key={id}
            type="button"
            className={'nav-item' + (s.screen === id ? ' active' : '')}
            onClick={() => handleNavigation(id)}
          >
            <span className="ico">
              <Icon name={iconName} size={19} />
            </span>

            <span className="nav-item-label">{L['m_' + id] || id}</span>
          </button>
        ))}
      </nav>

      <div className="sb-foot">
        <div className="user-row">
          <div
            className="avatar"
            style={{
              width: 38,
              height: 38,
              fontSize: 14,
              background: AVATAR[s.role],
            }}
          >
            {initials}
          </div>

          <div className="user-details">
            <div className="user-name">{displayName}</div>

            <div className="user-sub">{identity}</div>
          </div>
        </div>

        <button type="button" className="btn-logout" onClick={logout}>
          <Icon name="logout" size={17} />
          {L.logout}
        </button>
      </div>
    </aside>
  );
}
