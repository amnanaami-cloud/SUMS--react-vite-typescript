import React from 'react';
import { Icon } from '../icons';
import { useStore } from '../store';
import { AVATAR, gradeBadgeColor } from '../data';
import type { Role } from '../types';

export const Avatar = ({ role, size = 40, txt }: { role: Role; size?: number; txt: string }) => (
  <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.36, background: AVATAR[role] }}>
    {txt}
  </div>
);

export const Bar = ({ pct, color, h = 7 }: { pct: number; color: string; h?: number }) => (
  <div className="bar" style={{ height: h }}>
    <span style={{ width: `${pct}%`, background: color }} />
  </div>
);

export const Badge = ({ color, children, radius }: { color: string; children: React.ReactNode; radius?: number }) => (
  <span className="badge" style={{ background: color + '1a', color, borderRadius: radius }}>
    {children}
  </span>
);

export const SectionTitle = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div className="section-title" style={style}>
    {children}
  </div>
);

/** Stat cards row driven by [icon,label,value,sub,color] tuples */
export function StatGrid({ items }: { items: [string, string, string, string, string][] }) {
  return (
    <div className="grid-stats">
      {items.map((s, i) => (
        <div key={i} className="stat" style={{ borderInlineStartColor: s[4] }}>
          <div className="top">
            <div className="lbl">{s[1]}</div>
            <span style={{ color: s[4] }}>
              <Icon name={s[0]} />
            </span>
          </div>
          <div className="val">{s[2]}</div>
          <div className="sub">{s[3]}</div>
        </div>
      ))}
    </div>
  );
}

export function GradeBadge({ g }: { g: string }) {
  const c = gradeBadgeColor(g);
  return (
    <span className="grade-badge" style={{ background: c + '1a', color: c }}>
      {g}
    </span>
  );
}

/** Role-specific stat card data */
export function useStatCards(): [string, string, string, string, string][] {
  const { s, L, cn } = useStore();
  const by: Partial<Record<Role, [string, string, string, string, string][]>> = {
    student: [
      ['home', cn('Enrolled Courses', 'المواد المسجلة'), '5', cn('this semester', 'هذا الفصل'), '#13737A'],
      ['chart', L.cumGpa, '3.62', cn('of 4.0', 'من ٤٫٠'), '#D4AF37'],
      ['check', cn('Attendance', 'الحضور'), '88%', cn('overall', 'إجمالي'), '#10B981'],
      ['graduation', cn('Progress', 'التقدم'), '72%', cn('96 / 132 cr', '٩٦ / ١٣٢ س'), '#3B82F6'],
    ],
    instructor: [
      ['book', cn('My Classes', 'صفوفي'), '3', cn('this term', 'هذا الفصل'), '#13737A'],
      ['users', cn('Total Students', 'مجموع الطلاب'), '96', cn('across classes', 'في الصفوف'), '#FBCA89'],
      ['check', cn('Attendance Due', 'حضور مستحق'), '2', cn('sessions', 'جلسات'), '#F59E0B'],
      ['chart', cn('Grades Pending', 'درجات معلقة'), '1', cn('sheet', 'كشف'), '#EF4444'],
    ],
    advisor: [
      ['users', cn('My Advisees', 'طلابي'), '42', cn('assigned', 'معيّن'), '#13737A'],
      ['clock', L.pendingApprovals, '7', cn('to review', 'للمراجعة'), '#F59E0B'],
      ['alert', cn('At Risk', 'معرضون للخطر'), '3', cn('probation', 'إنذار'), '#EF4444'],
      ['check', cn('Meetings', 'اللقاءات'), '12', cn('this month', 'هذا الشهر'), '#10B981'],
    ],
    registrar: [
      ['users', cn('Total Students', 'مجموع الطلاب'), '8,420', cn('active', 'نشط'), '#13737A'],
      ['clock', cn('Pending Reg.', 'تسجيلات معلقة'), '184', cn('to process', 'للمعالجة'), '#F59E0B'],
      ['book', cn('Courses Offered', 'مواد مطروحة'), '312', cn('this term', 'هذا الفصل'), '#3B82F6'],
      ['layers', cn('Sections', 'الشعب'), '640', cn('open', 'مفتوحة'), '#D4AF37'],
    ],
    dean: [
      ['users', cn('Total Enrollment', 'إجمالي المسجلين'), '8,420', '+4.2%', '#10B981'],
      ['check', cn('Retention', 'معدل البقاء'), '91%', '+1.8%', '#10B981'],
      ['chart', cn('Avg GPA', 'متوسط المعدل'), '3.14', '+0.06', '#10B981'],
      ['graduation', cn('Graduation Rate', 'معدل التخرج'), '78%', '−0.9%', '#EF4444'],
    ],
    depthead: [
      ['users', cn('Faculty', 'أعضاء الهيئة'), '18', cn('members', 'عضو'), '#13737A'],
      ['book', cn('Dept Courses', 'مواد القسم'), '34', cn('this term', 'هذا الفصل'), '#3B82F6'],
      ['clock', cn('Grade Sheets', 'كشوف الدرجات'), '4', cn('to approve', 'للاعتماد'), '#F59E0B'],
      ['users', cn('Students', 'الطلاب'), '620', cn('in dept', 'في القسم'), '#D4AF37'],
    ],
    coordinator: [
      ['users', cn('Program Students', 'طلاب البرنامج'), '312', cn('enrolled', 'مسجل'), '#13737A'],
      ['graduation', cn('On Track', 'في المسار'), '268', cn('to graduate', 'للتخرج'), '#10B981'],
      ['alert', cn('Behind Plan', 'متأخرون'), '44', cn('need review', 'بحاجة مراجعة'), '#F59E0B'],
      ['book', cn('Curriculum', 'الخطة'), '132', cn('total credits', 'مجموع الساعات'), '#3B82F6'],
    ],
    uniregistrar: [
      ['users', cn('Total Students', 'مجموع الطلاب'), '8,420', cn('university-wide', 'على مستوى الجامعة'), '#13737A'],
      ['calendar', cn('Active Terms', 'فصول نشطة'), '2', cn('this year', 'هذا العام'), '#10B981'],
      ['edit', cn('Pending Reg.', 'تسجيلات معلقة'), '184', cn('to process', 'للمعالجة'), '#F59E0B'],
      ['graduation', cn('Graduating', 'متوقع تخرجهم'), '640', cn('this term', 'هذا الفصل'), '#D4AF37'],
    ],
  };
  return by[s.role] ?? by.student!;
}
