import { Icon } from '../icons';
import { useStore } from '../store';
import { MENUS, NAMES, AVATAR } from '../data';

export function Sidebar() {
  const { s, L, ar, cn, nav, logout } = useStore();
  const nm = NAMES[s.role];
  const subs: Record<string, string> = {
    student: cn('Computer Science · Year 3', 'علوم الحاسوب · السنة ٣'), instructor: cn('Faculty of Engineering', 'كلية الهندسة'), advisor: cn('Academic Advising', 'الإرشاد الأكاديمي'), registrar: cn('Registration Office', 'دائرة التسجيل'), dean: cn('Faculty of Engineering & IT', 'كلية الهندسة وتقنية المعلومات'), depthead: cn('Computer Science Dept.', 'قسم علوم الحاسوب'), admin: cn('IT Services', 'خدمات تقنية المعلومات'), coordinator: cn('CS Program', 'برنامج علوم الحاسوب'), uniregistrar: cn('University Registry', 'سجل الجامعة'),
  };
  return (
    <aside className="sidebar">
      <div className="sb-head">
        <img src="assets/up-seal.png" alt="" />
        <div style={{ minWidth: 0 }}>
          <div className="sb-title">{L.uni}</div>
          <div className="sb-sub">SUMS · {L['r_' + s.role]}</div>
        </div>
      </div>
      <nav className="sb-nav">
        {MENUS[s.role].map(([id, ic]) => (
          <button key={id} className={'nav-item' + (s.screen === id ? ' active' : '')} onClick={() => nav(id)}>
            <span className="ico"><Icon name={ic} size={19} /></span>{L['m_' + id] || id}
          </button>
        ))}
      </nav>
      <div className="sb-foot">
        <div className="user-row">
          <div className="avatar" style={{ width: 38, height: 38, fontSize: 14, background: AVATAR[s.role] }}>{nm[2]}</div>
          <div style={{ minWidth: 0 }}>
            <div className="user-name">{nm[ar ? 1 : 0]}</div>
            <div className="user-sub">{subs[s.role]}</div>
          </div>
        </div>
        <button className="btn-logout" onClick={logout}><Icon name="logout" size={17} />{L.logout}</button>
      </div>
    </aside>
  );
}
