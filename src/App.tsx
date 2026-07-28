import { useEffect, useState } from 'react';
import { useStore } from './store';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Modals, Toast } from './components/Modals';
import { SCREENS, screenKey } from './screens';
import { Placeholder } from './screens/shared';
import { BUILT } from './data';

export function App() {
  const { s, L, ar } = useStore();

  // حالة فتح وإغلاق السايدبار
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // مزامنة لغة واتجاه الصفحة
  useEffect(() => {
    document.documentElement.lang = s.lang;
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
  }, [s.lang, ar]);

  // إغلاق السايدبار عند الضغط على Escape
  useEffect(() => {
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', closeWithEscape);

    return () => {
      window.removeEventListener('keydown', closeWithEscape);
    };
  }, []);

  // منع تحريك الصفحة الخلفية عند فتح السايدبار على الموبايل
  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    if (s.view !== 'app' || !sidebarOpen || !isMobile) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [s.view, sidebarOpen]);

  if (s.view === 'loading') {
    return (
      <div className="login-wrap" role="status">
        <span className="spinner" /> Loading SUMS…
      </div>
    );
  }

  if (s.view === 'login') {
    return (
      <>
        <Login />
        <Toast />
      </>
    );
  }

  const title = s.screen === 'profile' ? L.m_profile : L['m_' + s.screen] || s.screen;

  const built = BUILT[s.role].includes(s.screen);
  const Screen = built ? SCREENS[screenKey(s.role, s.screen)] : undefined;

  const dark = s.role === 'admin';

  const toggleSidebar = () => {
    setSidebarOpen((previous) => !previous);
  };

  const closeSidebarOnMobile = () => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      <div
        className={['app', dark ? 'dark' : '', sidebarOpen ? 'sidebar-open' : 'sidebar-closed']
          .filter(Boolean)
          .join(' ')}
      >
        <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} onNavigate={closeSidebarOnMobile} />

        {/* خلفية الموبايل عند فتح السايدبار */}
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label={ar ? 'إغلاق القائمة الجانبية' : 'Close sidebar'}
          onClick={() => setSidebarOpen(false)}
        />

        <main className="main">
          <Topbar title={title} sidebarOpen={sidebarOpen} onSidebarToggle={toggleSidebar} />

          <div className="content">
            <div className="content-inner" key={s.role + s.screen}>
              {Screen ? <Screen /> : <Placeholder title={title} />}
            </div>
          </div>
        </main>
      </div>

      <Modals />
      <Toast />
    </>
  );
}
