import React from 'react';

const ICONS: Record<string, string[]> = {
  home: ['M3 11l9-8 9 8', 'M5 10v10h5v-6h4v6h5V10'],
  edit: ['M4 20h4L18 10l-4-4L4 16z', 'M14 6l4 4'],
  book: ['M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z', 'M6 19h13'],
  chart: ['M4 20V4', 'M4 20h16', 'M8 20v-6', 'M13 20V9', 'M18 20v-9'],
  check: ['M4 12l5 5L20 6'],
  graduation: ['M2 8l10-4 10 4-10 4z', 'M6 11v5c0 1.5 3 2.5 6 2.5s6-1 6-2.5v-5', 'M22 8v5'],
  user: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21a8 8 0 0 1 16 0'],
  users: [
    'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    'M2 21a7 7 0 0 1 14 0',
    'M17 11a4 4 0 0 0 0-8',
    'M22 21a7 7 0 0 0-5-6.7',
  ],
  calendar: ['M7 3v4', 'M17 3v4', 'M4 8h16', 'M4 5h16v16H4z'],
  bell: ['M6 9a6 6 0 1 1 12 0v5l2 2H4l2-2z', 'M10 20a2 2 0 0 0 4 0'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],

  'chevron-left': ['M15 18l-6-6 6-6'],
  'chevron-right': ['M9 18l6-6-6-6'],
  cog: [
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    'M12 2v3',
    'M12 19v3',
    'M2 12h3',
    'M19 12h3',
    'M5 5l2 2',
    'M17 17l2 2',
    'M19 5l-2 2',
    'M7 17l-2 2',
  ],
  logout: ['M15 4h4v16h-4', 'M4 12h11', 'M11 8l4 4-4 4'],
  building: ['M4 21V5l8-2 8 2v16', 'M9 9h.01', 'M9 13h.01', 'M15 9h.01', 'M15 13h.01', 'M9 21v-4h6v4'],
  layers: ['M12 3l9 5-9 5-9-5z', 'M3 13l9 5 9-5'],
  shield: ['M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z'],
  search: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z', 'M20 20l-4-4'],
  eye: ['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z', 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
  eyeoff: [
    'M3 3l18 18',
    'M10.5 5.2A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.3 4',
    'M6.2 6.3C3.4 8.1 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4-.9',
  ],
  alert: ['M12 3l10 18H2z', 'M12 10v5', 'M12 17.5h.01'],
  lock: ['M6 10V8a6 6 0 0 1 12 0v2', 'M4 10h16v11H4z'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
  pin: ['M12 21s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12z', 'M12 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  cart: ['M4 5h2l2 11h10l2-8H7', 'M9 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2z', 'M17 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2z'],
  download: ['M12 4v11', 'M8 11l4 4 4-4', 'M5 20h14'],
};

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const d = ICONS[name] || ICONS.home;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {d.map((p, i) => (
        <path key={i} d={p} />
      ))}
    </svg>
  );
}
