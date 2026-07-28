import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { ApiError } from '../api/errors';
import {
  useAnnouncementsQuery,
  useCurriculumQuery,
  useDashboardQuery,
  useProgressQuery,
  useReportsQuery,
  useScheduleQuery,
  useStudentsQuery,
  useTermsQuery,
} from '../api/hooks';
import { reportsApi } from '../api/reports';
import { AsyncState } from '../components/AsyncState';
import { Bar, SectionTitle, StatGrid } from '../components/ui';
import { Icon } from '../icons';
import { useStore } from '../store';

export function Profile() {
  const { s, L, ar, cn, toast } = useStore();
  const user = s.user;
  const changePassword = async () => {
    const currentPassword = window.prompt(cn('Current password:', 'كلمة المرور الحالية:'));
    if (!currentPassword) return;
    const newPassword = window.prompt(
      cn(
        'New password (8+ characters with upper/lowercase, digit, and symbol):',
        'كلمة المرور الجديدة (8 أحرف مع حرف كبير وصغير ورقم ورمز):',
      ),
    );
    if (!newPassword) return;
    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast(cn('Password changed. Sign in again.', 'تم تغيير كلمة المرور. سجل الدخول مجدداً.'));
      await authApi.logout();
      window.location.reload();
    } catch (error) {
      toast(error instanceof ApiError ? error.code : 'REQUEST_FAILED');
    }
  };
  const name = user ? (ar ? user.nameAr : user.nameEn) : '';
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const fields = [
    [cn('Full Name', 'الاسم الكامل'), name],
    [cn('University ID', 'الرقم الجامعي'), user?.universityId ?? '—'],
    [cn('Employee ID', 'رقم الموظف'), user?.employeeId ?? '—'],
    [cn('Email', 'البريد'), user?.email ?? '—'],
    [cn('Role', 'الدور'), L['r_' + s.role]],
    [cn('Language', 'اللغة'), user?.preferredLanguage ?? s.lang],
  ];
  return (
    <div className="profile-layout">
      <div className="card card-pad center">
        <div className="avatar profile-avatar">{initials}</div>
        <h2>{name}</h2>
        <small>{L['r_' + s.role]}</small>
        <button
          className="btn-tint"
          disabled
          title={cn(
            'Contact editing is available through PATCH /profile; the bilingual form is pending review.',
            'تعديل بيانات التواصل متاح عبر PATCH /profile؛ نموذج اللغتين بانتظار المراجعة.',
          )}
        >
          {L.editProfile}
        </button>
        <button className="btn-ghost" onClick={() => void changePassword()}>
          {L.changePwd}
        </button>
      </div>
      <div className="card card-pad">
        <SectionTitle>{L.personalInfo}</SectionTitle>
        <div className="details-grid">
          {fields.map(([label, value]) => (
            <div key={label}>
              <small>{label}</small>
              <div className="readonly-field">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WeeklySchedule() {
  const { L, ar, cn } = useStore();
  const schedule = useScheduleQuery();
  const days = [
    cn('Sunday', 'الأحد'),
    cn('Monday', 'الإثنين'),
    cn('Tuesday', 'الثلاثاء'),
    cn('Wednesday', 'الأربعاء'),
    cn('Thursday', 'الخميس'),
    cn('Friday', 'الجمعة'),
    cn('Saturday', 'السبت'),
  ];
  return (
    <AsyncState loading={schedule.isLoading} error={schedule.error} empty={!schedule.data?.length}>
      <div className="card card-pad">
        <SectionTitle>{L.weeklySchedule}</SectionTitle>
        <div className="schedule-grid">
          {days.map((day, index) => (
            <div key={day} className="schedule-day">
              <strong>{day}</strong>
              {schedule.data
                ?.filter((item) => item.dayOfWeek === index)
                .map((meeting) => (
                  <div key={meeting.id} className="schedule-item">
                    <strong>{meeting.section?.course.code}</strong>
                    <small>
                      {new Date(meeting.startsAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'UTC',
                      })}{' '}
                      · {meeting.room?.code ?? 'TBA'}
                    </small>
                    <small>{ar ? meeting.section?.course.nameAr : meeting.section?.course.nameEn}</small>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </AsyncState>
  );
}

export function Reports() {
  const { ar, cn, toast } = useStore();
  const reports = useReportsQuery();
  const [busy, setBusy] = useState('');
  const download = async (key: string, format: 'PDF' | 'XLSX') => {
    setBusy(`${key}-${format}`);
    try {
      await reportsApi.export(key, format);
      toast(cn('Report exported.', 'تم تصدير التقرير.'));
    } catch (error) {
      toast(error instanceof ApiError ? error.code : 'REQUEST_FAILED');
    } finally {
      setBusy('');
    }
  };
  return (
    <AsyncState loading={reports.isLoading} error={reports.error} empty={!reports.data?.length}>
      <div className="card-grid">
        {reports.data?.map((report) => (
          <div key={report.key} className="card card-pad">
            <div className="report-icon">
              <Icon name="chart" size={22} />
            </div>
            <h3>{ar ? report.titleAr : report.titleEn}</h3>
            <small>{cn('Exports are permission-scoped and audited.', 'التصدير مقيّد بالصلاحيات ومسجل للتدقيق.')}</small>
            <div className="row-actions">
              <button className="btn-teal" disabled={Boolean(busy)} onClick={() => void download(report.key, 'PDF')}>
                PDF
              </button>
              <button className="btn-tint" disabled={Boolean(busy)} onClick={() => void download(report.key, 'XLSX')}>
                Excel
              </button>
            </div>
          </div>
        ))}
      </div>
    </AsyncState>
  );
}

export function GenericDashboard() {
  const { ar, cn } = useStore();
  const dashboard = useDashboardQuery();
  const announcements = useAnnouncementsQuery();
  const stats = Object.entries(dashboard.data?.stats ?? {}).map(
    ([key, value], index): [string, string, string, string, string] => [
      'chart',
      key.replace(/([A-Z])/g, ' $1'),
      String(value ?? '—'),
      cn('current scope', 'النطاق الحالي'),
      ['#13737A', '#D4AF37', '#3B82F6', '#10B981'][index % 4],
    ],
  );
  return (
    <AsyncState loading={dashboard.isLoading} error={dashboard.error}>
      <StatGrid items={stats} />
      <div className="card card-pad">
        <SectionTitle>{cn('Recent announcements', 'أحدث الإعلانات')}</SectionTitle>
        <AsyncState loading={announcements.isLoading} error={announcements.error} empty={!announcements.data?.length}>
          {announcements.data?.slice(0, 6).map((item) => (
            <div key={item.id} className="announcement-row">
              <strong>{ar ? item.titleAr : item.titleEn}</strong>
              <p>{ar ? item.bodyAr : item.bodyEn}</p>
            </div>
          ))}
        </AsyncState>
      </div>
    </AsyncState>
  );
}

export function StudentsTable({ withActions }: { withActions: boolean }) {
  const { L, ar, cn } = useStore();
  const [search, setSearch] = useState('');
  const students = useStudentsQuery(search);
  return (
    <div className="tbl-wrap">
      <div className="search-row">
        <Icon name="search" size={18} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={L.searchStudents} />
        {withActions && (
          <button
            className="btn-teal"
            disabled
            title={cn(
              'Student creation requires the administrative form/API',
              'إنشاء الطالب يتطلب النموذج الإداري/الواجهة',
            )}
          >
            {L.addStudent}
          </button>
        )}
      </div>
      <AsyncState loading={students.isLoading} error={students.error} empty={!students.data?.items.length}>
        <table>
          <thead>
            <tr>
              <th>{L.thName}</th>
              <th>ID</th>
              <th>{L.thMajor}</th>
              <th>{L.yearLabel}</th>
              <th>GPA</th>
              <th>{L.thStatus}</th>
            </tr>
          </thead>
          <tbody>
            {students.data?.items.map((student) => (
              <tr key={student.id}>
                <td>
                  <strong>
                    {ar
                      ? `${student.user.firstNameAr} ${student.user.lastNameAr}`
                      : `${student.user.firstNameEn} ${student.user.lastNameEn}`}
                  </strong>
                  <small>{student.user.email}</small>
                </td>
                <td>{student.universityId}</td>
                <td>{ar ? student.program.nameAr : student.program.nameEn}</td>
                <td>{student.currentLevel}</td>
                <td>{student.cumulativeGpa ?? '—'}</td>
                <td>
                  <span className="badge">
                    {student.standing} · {student.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AsyncState>
    </div>
  );
}

export function Curriculum() {
  const { L, ar } = useStore();
  const curriculum = useCurriculumQuery();
  const grouped =
    curriculum.data?.courses.reduce<Record<string, typeof curriculum.data.courses>>((result, item) => {
      (result[item.category] ??= []).push(item);
      return result;
    }, {}) ?? {};
  return (
    <AsyncState loading={curriculum.isLoading} error={curriculum.error} empty={!curriculum.data}>
      <div className="stack">
        {Object.entries(grouped).map(([category, courses]) => (
          <div key={category} className="card card-pad">
            <SectionTitle>{category}</SectionTitle>
            {courses.map((item) => (
              <div key={item.course.code} className="record-row">
                <div>
                  <strong>
                    {item.course.code} · {ar ? item.course.nameAr : item.course.nameEn}
                  </strong>
                  <small>
                    {L.yearLabel} {item.recommendedLevel}
                  </small>
                </div>
                <span>
                  {item.course.credits} {L.creditsLabel}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </AsyncState>
  );
}

export function ProgramProgress() {
  const { L, ar } = useStore();
  const students = useStudentsQuery();
  return (
    <AsyncState loading={students.isLoading} error={students.error} empty={!students.data?.items.length}>
      <div className="card card-pad">
        <SectionTitle>
          {L.degreePlan} · {L.completionL}
        </SectionTitle>
        {students.data?.items.map((student) => {
          const required = student.program.requiredCredits ?? 0;
          const percent = required ? Math.min(100, Math.trunc((student.earnedCredits / required) * 100)) : 0;
          const color = percent >= 60 ? '#10B981' : percent >= 40 ? '#F59E0B' : '#EF4444';
          return (
            <div key={student.id} className="metric-row">
              <div className="row-between">
                <strong>
                  {ar
                    ? `${student.user.firstNameAr} ${student.user.lastNameAr}`
                    : `${student.user.firstNameEn} ${student.user.lastNameEn}`}{' '}
                  · {student.universityId}
                </strong>
                <span>
                  {student.earnedCredits}/{required} · {percent}%
                </span>
              </div>
              <Bar pct={percent} color={color} h={8} />
            </div>
          );
        })}
      </div>
    </AsyncState>
  );
}

export function Terms() {
  const { L, ar, cn } = useStore();
  const terms = useTermsQuery();
  return (
    <AsyncState loading={terms.isLoading} error={terms.error} empty={!terms.data?.length}>
      <div className="tbl-wrap">
        <div className="tbl-head row-between">
          <span>{L.m_terms}</span>
          <button
            className="btn-teal"
            disabled
            title={cn('Term creation is available through the documented API', 'إنشاء الفصل متاح عبر الواجهة الموثقة')}
          >
            + {L.generate}
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>{L.semesterLabel}</th>
              <th>{cn('Dates', 'التواريخ')}</th>
              <th>{L.m_courses}</th>
              <th>{cn('Registration requests', 'طلبات التسجيل')}</th>
              <th>{L.thStatus}</th>
            </tr>
          </thead>
          <tbody>
            {terms.data?.map((term) => (
              <tr key={term.id}>
                <td>
                  <strong>{ar ? term.nameAr : term.nameEn}</strong>
                  <small>{term.code}</small>
                </td>
                <td>
                  {term.startsOn ? new Date(term.startsOn).toLocaleDateString() : ''} –{' '}
                  {term.endsOn ? new Date(term.endsOn).toLocaleDateString() : ''}
                </td>
                <td>{term._count?.sections ?? 0}</td>
                <td>{term._count?.registrationRequests ?? 0}</td>
                <td>
                  <span className="badge">{term.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AsyncState>
  );
}

export function Placeholder({ title }: { title: string }) {
  const { s, L, cn } = useStore();
  return (
    <div className="card card-pad center placeholder">
      <Icon name="layers" size={30} />
      <h2>{title}</h2>
      <p>
        {cn(
          'This capability is intentionally unavailable in the current role or release. No placeholder action will change academic data.',
          'هذه الإمكانية غير متاحة عمداً لهذا الدور أو الإصدار. لن يغيّر أي إجراء تجريبي البيانات الأكاديمية.',
        )}
      </p>
      <small>
        {L['r_' + s.role]} · {title}
      </small>
    </div>
  );
}
