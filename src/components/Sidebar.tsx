import { Icon } from '../icons';
import { useStore } from '../store';
import { MENUS, NAMES, AVATAR } from '../data';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}

export function Sidebar({
  isOpen,
  onToggle,
  onNavigate,
}: SidebarProps) {
  const { s, L, ar, cn, nav, logout } = useStore();

  const nm = NAMES[s.role];

  const subs: Record<string, string> = {
    student: cn(
      'Computer Science · Year 3',
      'علوم الحاسوب · السنة ٣'
    ),
    instructor: cn(
      'Faculty of Engineering',
      'كلية الهندسة'
    ),
    advisor: cn(
      'Academic Advising',
      'الإرشاد الأكاديمي'
    ),
    registrar: cn(
      'Registration Office',
      'دائرة التسجيل'
    ),
    dean: cn(
      'Faculty of Engineering & IT',
      'كلية الهندسة وتقنية المعلومات'
    ),
    depthead: cn(
      'Computer Science Dept.',
      'قسم علوم الحاسوب'
    ),
    admin: cn(
      'IT Services',
      'خدمات تقنية المعلومات'
    ),
    coordinator: cn(
      'CS Program',
      'برنامج علوم الحاسوب'
    ),
    uniregistrar: cn(
      'University Registry',
      'سجل الجامعة'
    ),
  };

  const handleNavigation = (screenId: string) => {
    nav(screenId);
    onNavigate();
  };

  return (
    <aside
      className="sidebar"
      aria-label={ar ? 'القائمة الجانبية' : 'Sidebar'}
      aria-hidden={!isOpen}
    >
      <div className="sb-head">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={onToggle}
          aria-label={
            ar
              ? 'إغلاق القائمة الجانبية'
              : 'Close sidebar'
          }
          title={
            ar
              ? 'إغلاق القائمة الجانبية'
              : 'Close sidebar'
          }
        >
          <Icon
            name={ar ? 'chevron-right' : 'chevron-left'}
            size={18}
          />
        </button>

        <img
          src="assets/up-seal.png"
          alt={ar ? 'شعار جامعة فلسطين' : 'University seal'}
        />

        <div className="sb-brand-text">
          <div className="sb-title">{L.uni}</div>

          <div className="sb-sub">
            SUMS · {L['r_' + s.role]}
          </div>
        </div>
      </div>

      <nav className="sb-nav">
        {MENUS[s.role].map(([id, iconName]) => (
          <button
            key={id}
            type="button"
            className={
              'nav-item' +
              (s.screen === id ? ' active' : '')
            }
            onClick={() => handleNavigation(id)}
          >
            <span className="ico">
              <Icon name={iconName} size={19} />
            </span>

            <span className="nav-item-label">
              {L['m_' + id] || id}
            </span>
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
            {nm[2]}
          </div>

          <div className="user-details">
            <div className="user-name">
              {nm[ar ? 1 : 0]}
            </div>

            <div className="user-sub">
              {subs[s.role]}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn-logout"
          onClick={logout}
        >
          <Icon name="logout" size={17} />
          {L.logout}
        </button>
      </div>
    </aside>
  );
}