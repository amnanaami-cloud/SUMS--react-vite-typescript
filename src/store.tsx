import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { AppState, Lang, Role, ModalKind, Dict } from './types';
import { D } from './i18n';
import { authApi } from './api/auth';
import { ApiError } from './api/errors';
import { onSessionExpired, onSessionUpdated, setAccessToken } from './api/client';

interface Store {
  s: AppState;
  L: Dict;
  ar: boolean;
  cn: (en: string, ar: string) => string;
  t: (key: string) => string;
  setLoginRole: (r: Role) => void;
  nav: (screen: string) => void;
  toggleLang: () => void;
  togglePw: () => void;
  signIn: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleCart: (code: string) => void;
  openModal: (m: ModalKind) => void;
  closeModal: () => void;
  toast: (msg: string) => void;
  toastMsg: string | null;
}

const Ctx = createContext<Store | null>(null);
export const useStore = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used within StoreProvider');
  return v;
};

const INITIAL: AppState = {
  view: 'loading',
  lang: 'en',
  loginRole: 'student',
  role: 'student',
  screen: 'dashboard',
  cart: [],
  modal: null,
  loginLoading: false,
  showPw: false,
  user: null,
  loginError: null,
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<AppState>(INITIAL);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const L = D[s.lang];
  const ar = s.lang === 'ar';
  const cn = useCallback((en: string, arv: string) => (s.lang === 'ar' ? arv : en), [s.lang]);
  const t = useCallback((key: string) => D[s.lang][key] ?? key, [s.lang]);

  useEffect(() => {
    let active = true;
    onSessionExpired(() => {
      if (active) setS((p) => ({ ...p, view: 'login', user: null, loginError: 'SESSION_EXPIRED', modal: null }));
    });
    onSessionUpdated(({ user }) => {
      if (active)
        setS((p) => ({
          ...p,
          view: 'app',
          user,
          role: user.activeRole,
          loginRole: user.activeRole,
          screen: 'dashboard',
          loginError: null,
        }));
    });
    void authApi.restore().catch(() => {
      setAccessToken(null);
      if (active) setS((p) => ({ ...p, view: 'login', user: null }));
    });
    return () => {
      active = false;
    };
  }, []);

  const setLoginRole = (r: Role) => setS((p) => ({ ...p, loginRole: r }));
  const nav = (screen: string) => setS((p) => ({ ...p, screen }));
  const toggleLang = () => setS((p) => ({ ...p, lang: (p.lang === 'en' ? 'ar' : 'en') as Lang }));
  const togglePw = () => setS((p) => ({ ...p, showPw: !p.showPw }));
  const signIn = async (identifier: string, password: string) => {
    setS((p) => ({ ...p, loginLoading: true, loginError: null }));
    try {
      const result = await authApi.login(identifier.trim(), password, s.loginRole);
      setS((p) => ({
        ...p,
        view: 'app',
        role: result.user.activeRole,
        loginRole: result.user.activeRole,
        user: result.user,
        screen: 'dashboard',
        loginLoading: false,
      }));
    } catch (error) {
      const code = error instanceof ApiError ? error.code : 'REQUEST_FAILED';
      setS((p) => ({ ...p, loginLoading: false, loginError: code }));
      throw error;
    }
  };
  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      setAccessToken(null);
    }
    setS((p) => ({ ...p, view: 'login', user: null, modal: null, screen: 'dashboard' }));
  };
  const toggleCart = (code: string) =>
    setS((p) => ({ ...p, cart: p.cart.includes(code) ? p.cart.filter((c) => c !== code) : [...p.cart, code] }));
  const openModal = (m: ModalKind) => setS((p) => ({ ...p, modal: m }));
  const closeModal = () => setS((p) => ({ ...p, modal: null }));
  const toast = (msg: string) => {
    setToastMsg(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToastMsg(null), 2200);
  };

  const value: Store = {
    s,
    L,
    ar,
    cn,
    t,
    setLoginRole,
    nav,
    toggleLang,
    togglePw,
    signIn,
    logout,
    toggleCart,
    openModal,
    closeModal,
    toast,
    toastMsg,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
