import { useEffect } from 'react';
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

  // keep <html> lang/dir in sync with the language toggle
  useEffect(() => {
    document.documentElement.lang = s.lang;
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
  }, [s.lang, ar]);

  if (s.view === 'login') {
    return (<><Login /><Toast /></>);
  }

  const title = s.screen === 'profile' ? L.m_profile : (L['m_' + s.screen] || s.screen);
  const built = BUILT[s.role].includes(s.screen);
  const Screen = built ? SCREENS[screenKey(s.role, s.screen)] : undefined;
  const dark = s.role === 'admin';

  return (
    <>
      <div className={'app' + (dark ? ' dark' : '')}>
        <Sidebar />
        <main className="main">
          <Topbar title={title} />
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
