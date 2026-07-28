import { Icon } from '../icons';
import { useStore } from '../store';
import { NAMES, AVATAR } from '../data';

interface TopbarProps {
  title: string;
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

export function Topbar({
  title,
  sidebarOpen,
  onSidebarToggle,
}: TopbarProps) {
  const {
    s,
    L,
    ar,
    cn,
    toggleLang,
    toast,
  } = useStore();

  const nm = NAMES[s.role];

  return (
    <header className="topbar">
      <div className="topbar-leading">
        {!sidebarOpen && (
          <button
            type="button"
            className="sidebar-open-btn"
            onClick={onSidebarToggle}
            aria-label={
              ar
                ? 'فتح القائمة الجانبية'
                : 'Open sidebar'
            }
            title={
              ar
                ? 'فتح القائمة الجانبية'
                : 'Open sidebar'
            }
          >
            <Icon name="menu" size={20} />
          </button>
        )}

        <div>
          <div className="role-label">
            {L['r_' + s.role]}
          </div>

          <h1>{title}</h1>
        </div>
      </div>

      <div className="top-actions">
        <button
          type="button"
          className="chip-btn"
          onClick={toggleLang}
        >
          {ar ? 'English' : 'العربية'}
        </button>

        <button
          type="button"
          className="icon-btn"
          onClick={() =>
            toast(
              cn(
                'No new notifications',
                'لا توجد إشعارات جديدة'
              )
            )
          }
          aria-label={
            ar ? 'الإشعارات' : 'Notifications'
          }
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
          {nm[2]}
        </div>
      </div>
    </header>
  );
}