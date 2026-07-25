# SUMS — Smart University Management System
### جامعة فلسطين · University of Palestine
#### React + Vite + TypeScript

نسخة React كاملة ومطابقة للتصميم — نظام إدارة جامعي ذكي لتسعة أدوار، ثنائي اللغة (عربي RTL ↔ إنجليزي LTR).

A complete React port of the SUMS design — a Smart University Management System for nine roles, fully bilingual (Arabic RTL ↔ English LTR).

---

## 🚀 التشغيل · Getting started

```bash
npm install
npm run dev      # dev server (http://localhost:5173)
npm run build    # type-check + production build → dist/
npm run preview  # preview the production build
```

المتطلبات · Requirements: **Node.js 18+**.

---

## 🏗️ البنية · Architecture

```
react-app/
├── index.html
├── package.json · tsconfig*.json · vite.config.ts
├── public/
│   ├── assets/up-seal.png        # university seal
│   └── design-tokens.json        # design tokens for handoff
└── src/
    ├── main.tsx                  # entry — mounts <App/> in <StoreProvider/>
    ├── App.tsx                   # login vs. app shell; screen dispatch
    ├── index.css                 # design tokens + component classes
    ├── types.ts                  # Lang · Role · AppState · ModalKind
    ├── i18n.ts                   # AR + EN dictionaries
    ├── data.ts                   # menus, roles, mock data, helpers
    ├── icons.tsx                 # inline SVG <Icon/> set
    ├── store.tsx                 # React Context: state + actions + i18n
    ├── components/               # Login · Sidebar · Topbar · Modals · Toast · ui
    └── screens/                  # one file per role + shared.tsx + index.tsx (registry)
```

### كيف يعمل · How it works
- **الحالة** مركزية في `store.tsx` عبر React Context — `useStore()` يعطي الحالة والإجراءات والترجمة (`L`, `cn`, `t`).
- **التنقّل** يعتمد على `role + screen`؛ سجلّ الشاشات في `screens/index.tsx` يربط كل مفتاح `${role}.${screen}` بمكوّنه.
- **اللغة** تُبدّل عبر `toggleLang()` — يقلب `dir`/`lang` على `<html>` تلقائياً.
- **الثيم الداكن** للمدير يُفعّل عبر كلاس `.app.dark` (معرّف في `index.css`).

- Central state lives in `store.tsx` (React Context); `useStore()` exposes state, actions, and i18n helpers (`L`, `cn`, `t`).
- Routing is `role + screen`; the registry in `screens/index.tsx` maps each `${role}.${screen}` key to its component.
- Language toggles via `toggleLang()`, which flips `<html dir/lang>`.
- Admin dark theme is the `.app.dark` class (in `index.css`).

---

## 🎨 نظام التصميم · Design system

| Token | Value |
|---|---|
| Primary (Teal) | `#13737A` |
| Secondary (Peach) | `#FBCA89` |
| Accent (Gold) | `#D4AF37` |
| Headings | Playfair Display / Amiri |
| Body | Inter / Cairo |

القيم الكاملة في `src/index.css` (`:root`) و `public/design-tokens.json`.

---

## 👥 الأدوار · Roles
Student · Instructor · Advisor · Registrar · Sys Admin (dark) · Dean · Dept Head · Coordinator · Uni Registrar — **46 شاشة داخلية** + تسجيل دخول + نوافذ منبثقة، الكل بالعربية والإنجليزية.

---

## 📝 ملاحظات · Notes
- البيانات تجريبية للعرض — اربطها بواجهة API حقيقية عند الإنتاج.
- Mock data throughout; wire to a real API for production. State is in-memory (no backend).
- الخطوط من Google Fonts (تتطلب إنترنت).

© 2026 University of Palestine · جامعة فلسطين — SUMS
