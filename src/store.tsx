import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { AppState, Lang, Role, ModalKind, Dict } from './types';
import { D } from './i18n';

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
  signIn: () => void;
  logout: () => void;
  toggleCart: (code: string) => void;
  setAtt: (id: string, v: 'p' | 'a') => void;
  allAtt: (v: 'p' | 'a', ids: string[]) => void;
  setRegFilter: (f: string) => void;
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
  view: 'login', lang: 'en', loginRole: 'student', role: 'student', screen: 'dashboard',
  cart: ['CS340', 'CS355'], modal: null, loginLoading: false, showPw: false, att: {}, regFilter: 'submitted',
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<AppState>(INITIAL);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const L = D[s.lang];
  const ar = s.lang === 'ar';
  const cn = useCallback((en: string, arv: string) => (s.lang === 'ar' ? arv : en), [s.lang]);
  const t = useCallback((key: string) => D[s.lang][key] ?? key, [s.lang]);

  const setLoginRole = (r: Role) => setS((p) => ({ ...p, loginRole: r }));
  const nav = (screen: string) => setS((p) => ({ ...p, screen }));
  const toggleLang = () => setS((p) => ({ ...p, lang: (p.lang === 'en' ? 'ar' : 'en') as Lang }));
  const togglePw = () => setS((p) => ({ ...p, showPw: !p.showPw }));
  const signIn = () => {
    setS((p) => ({ ...p, loginLoading: true }));
    window.setTimeout(() => setS((p) => ({ ...p, view: 'app', role: p.loginRole, screen: 'dashboard', loginLoading: false })), 750);
  };
  const logout = () => setS((p) => ({ ...p, view: 'login', modal: null, screen: 'dashboard' }));
  const toggleCart = (code: string) => setS((p) => ({ ...p, cart: p.cart.includes(code) ? p.cart.filter((c) => c !== code) : [...p.cart, code] }));
  const setAtt = (id: string, v: 'p' | 'a') => setS((p) => ({ ...p, att: { ...p.att, [id]: v } }));
  const allAtt = (v: 'p' | 'a', ids: string[]) => setS((p) => { const m: Record<string, 'p' | 'a'> = {}; ids.forEach((id) => (m[id] = v)); return { ...p, att: m }; });
  const setRegFilter = (f: string) => setS((p) => ({ ...p, regFilter: f }));
  const openModal = (m: ModalKind) => setS((p) => ({ ...p, modal: m }));
  const closeModal = () => setS((p) => ({ ...p, modal: null }));
  const toast = (msg: string) => {
    setToastMsg(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToastMsg(null), 2200);
  };

  const value: Store = { s, L, ar, cn, t, setLoginRole, nav, toggleLang, togglePw, signIn, logout, toggleCart, setAtt, allAtt, setRegFilter, openModal, closeModal, toast, toastMsg };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
