import { Icon } from '../icons';
import { useStore } from '../store';
import { AVATAR } from '../data';

interface TopbarProps {
  title: string;
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

export function Topbar({ title, sidebarOpen, onSidebarToggle }: TopbarProps) {
  const { s, L, ar, cn, toggleLang, toast } = useStore();

  const displayName = s.user ? (ar ? s.user.nameAr : s.user.nameEn) : cn('SUMS User', 'مستخدم النظام');
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'SU';

  return (
    <header className="topbar">
      <div className="topbar-leading">
        {!sidebarOpen && (
          <button
            type="button"
            className="sidebar-open-btn"
            onClick={onSidebarToggle}
            aria-label={ar ? 'فتح القائمة الجانبية' : 'Open sidebar'}
            title={ar ? 'فتح القائمة الجانبية' : 'Open sidebar'}
          >
            <Icon name="menu" size={20} />
          </button>
        )}

        <div>
          <div className="role-label">{L['r_' + s.role]}</div>

          <h1>{title}</h1>
        </div>
      </div>

      <div className="top-actions">
        <button type="button" className="chip-btn" onClick={toggleLang}>
          {ar ? 'English' : 'العربية'}
        </button>

        <button
          type="button"
          className="icon-btn"
          onClick={() => toast(cn('No new notifications', 'لا توجد إشعارات جديدة'))}
          aria-label={ar ? 'الإشعارات' : 'Notifications'}
        >
          <Icon name="bell" size={18} />
          <span className="bell-dot" />
        </button>

        <div
          className="avatar"
          style={{
            width: 40,
            height: 40,
            fontSize: 14,
            background: AVATAR[s.role],
          }}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
