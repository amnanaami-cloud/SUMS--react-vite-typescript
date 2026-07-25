export type Lang = 'ar' | 'en';

export type Role =
  | 'student' | 'instructor' | 'advisor' | 'registrar'
  | 'admin' | 'depthead' | 'coordinator' | 'dean' | 'uniregistrar';

export type ModalKind = 'approval' | 'denied' | null;

export type Dict = Record<string, string>;

export interface AppState {
  view: 'login' | 'app';
  lang: Lang;
  loginRole: Role;
  role: Role;
  screen: string;
  cart: string[];
  modal: ModalKind;
  loginLoading: boolean;
  showPw: boolean;
  att: Record<string, 'p' | 'a'>;
  regFilter: string;
}
