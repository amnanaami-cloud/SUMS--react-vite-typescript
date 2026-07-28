export type Lang = 'ar' | 'en';

export type Role =
  | 'student'
  | 'instructor'
  | 'advisor'
  | 'registrar'
  | 'admin'
  | 'depthead'
  | 'coordinator'
  | 'dean'
  | 'uniregistrar';

export type ModalKind = 'denied' | null;

export type Dict = Record<string, string>;

export interface AuthUser {
  id: string;
  email: string;
  universityId: string | null;
  employeeId: string | null;
  nameEn: string;
  nameAr: string;
  preferredLanguage: string;
  roles: Role[];
  activeRole: Role;
  permissions: string[];
  studentProfile: Record<string, unknown> | null;
  employeeProfile: Record<string, unknown> | null;
}

export interface AppState {
  view: 'loading' | 'login' | 'app';
  lang: Lang;
  loginRole: Role;
  role: Role;
  screen: string;
  cart: string[];
  modal: ModalKind;
  loginLoading: boolean;
  showPw: boolean;
  user: AuthUser | null;
  loginError: string | null;
}
