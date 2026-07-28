import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AsyncState } from '../components/AsyncState';
import { Bar, GradeBadge, SectionTitle, StatGrid } from '../components/ui';
import { Icon } from '../icons';
import { registrationsApi } from '../api/registrations';
import { gradesApi } from '../api/grades';
import { ApiError } from '../api/errors';
import {
  useAnnouncementsQuery,
  useAttendanceSummaryQuery,
  useCoursesQuery,
  useDashboardQuery,
  useMyCoursesQuery,
  useScheduleQuery,
  useTranscriptQuery,
} from '../api/hooks';
import type { CourseSection, StudentCourseEnrollment } from '../api/types';
import { useStore } from '../store';

const time = (value: string) =>
  new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString() : '');

export function StudentDashboard() {
  const { s, L, ar, cn } = useStore();
  const dashboard = useDashboardQuery();
  const schedule = useScheduleQuery();
  const announcements = useAnnouncementsQuery();
  const data = dashboard.data;
  const stat = (key: string) => String(data?.stats[key] ?? '—');
  const required = Number(data?.stats.requiredCredits ?? 0);
  const earned = Number(data?.stats.earnedCredits ?? 0);
  const progress = required ? Math.trunc((earned / required) * 100) : 0;
  const cards: [string, string, string, string, string][] = [
    [
      'home',
      cn('Enrolled Courses', 'المواد المسجلة'),
      stat('enrolledCourses'),
      cn('this semester', 'هذا الفصل'),
      '#13737A',
    ],
    ['chart', L.cumGpa, stat('cumulativeGpa'), cn('of 4.0', 'من 4.0'), '#D4AF37'],
    ['check', cn('Attendance', 'الحضور'), `${stat('attendancePercent')}%`, cn('overall', 'إجمالي'), '#10B981'],
    ['graduation', cn('Progress', 'التقدم'), `${progress}%`, `${earned} / ${required} ${L.creditsLabel}`, '#3B82F6'],
  ];
  return (
    <AsyncState loading={dashboard.isLoading} error={dashboard.error}>
      <div className="hero">
        <div>
          <div style={{ fontSize: 14, opacity: 0.85 }}>{L.welcome}</div>
          <div className="name">{s.user ? (ar ? s.user.nameAr : s.user.nameEn) : ''}</div>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 6 }}>{s.user?.universityId}</div>
        </div>
        <div className="gpa-box">
          <div className="big">{stat('cumulativeGpa')}</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>{L.cumGpa}</div>
        </div>
      </div>
      <StatGrid items={cards} />
      <div className="responsive-two-column">
        <div className="card card-pad">
          <SectionTitle>{L.todaySchedule}</SectionTitle>
          <AsyncState loading={schedule.isLoading} error={schedule.error} empty={!schedule.data?.length}>
            {schedule.data?.map((meeting) => (
              <div key={meeting.id} className="record-row">
                <div className="record-time">
                  {time(meeting.startsAt)}
                  <small>{meeting.room?.code ?? '—'}</small>
                </div>
                <div>
                  <strong>
                    {meeting.section?.course.code} ·{' '}
                    {ar ? meeting.section?.course.nameAr : meeting.section?.course.nameEn}
                  </strong>
                  <small>{meeting.section?.sectionCode}</small>
                </div>
              </div>
            ))}
          </AsyncState>
        </div>
        <div className="card card-pad">
          <SectionTitle>{L.announcements2}</SectionTitle>
          <AsyncState loading={announcements.isLoading} error={announcements.error} empty={!announcements.data?.length}>
            {announcements.data?.slice(0, 5).map((item) => (
              <div key={item.id} className="announcement-row">
                <small>{formatDate(item.publishedAt)}</small>
                <strong>{ar ? item.titleAr : item.titleEn}</strong>
                <p>{ar ? item.bodyAr : item.bodyEn}</p>
              </div>
            ))}
          </AsyncState>
        </div>
      </div>
    </AsyncState>
  );
}

function SectionCard({
  section,
  selected,
  onToggle,
}: {
  section: CourseSection;
  selected: boolean;
  onToggle: () => void;
}) {
  const { L, ar, cn } = useStore();
  const full = section.enrolledCount >= section.capacity;
  const meeting = section.meetings[0];
  const instructor = section.instructors?.[0]?.instructor.user;
  return (
    <div
      className="card"
      style={{ padding: '18px 20px', marginBottom: 12, border: `1.5px solid ${selected ? '#13737A' : 'transparent'}` }}
    >
      <div className="row-between" style={{ gap: 12, alignItems: 'start' }}>
        <div>
          <div className="course-title">
            <strong>{section.course.code}</strong>
            <span>{ar ? section.course.nameAr : section.course.nameEn}</span>
            <span className="badge">
              {section.course.credits} {L.creditsLabel}
            </span>
          </div>
          <div className="course-meta">
            <span>
              <Icon name="clock" size={15} /> {meeting ? `${meeting.dayOfWeek} · ${time(meeting.startsAt)}` : 'TBA'}
            </span>
            <span>
              <Icon name="pin" size={15} /> {meeting?.room?.code ?? 'TBA'}
            </span>
            <span>
              <Icon name="user" size={15} />{' '}
              {instructor
                ? ar
                  ? `${instructor.firstNameAr} ${instructor.lastNameAr}`
                  : `${instructor.firstNameEn} ${instructor.lastNameEn}`
                : 'TBA'}
            </span>
          </div>
          <small>
            {Math.max(0, section.capacity - section.enrolledCount)} {cn('seats left', 'مقعد متبقٍ')} · {L.prereq}:{' '}
            {section.course.prerequisites?.map((p) => p.prerequisite.code).join(', ') || cn('None', 'لا يوجد')}
          </small>
        </div>
        <button type="button" onClick={onToggle} className={selected ? 'btn-danger-soft' : 'btn-teal'}>
          {selected ? L.remove : full ? cn('Join waitlist', 'الانضمام لقائمة الانتظار') : L.add}
        </button>
      </div>
    </div>
  );
}

export function StudentRegistration() {
  const { s, L, cn, toggleCart, toast } = useStore();
  const [search, setSearch] = useState('');
  const courses = useCoursesQuery(search);
  const client = useQueryClient();
  const selected = useMemo(
    () => courses.data?.filter((section) => s.cart.includes(section.id)) ?? [],
    [courses.data, s.cart],
  );
  const submit = useMutation({
    mutationFn: () => {
      const termId = selected[0]?.term.id;
      if (!termId || selected.some((section) => section.term.id !== termId)) throw new Error('TERM_SELECTION_REQUIRED');
      return registrationsApi.submit(
        termId,
        selected.map((section) => section.id),
      );
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['registrations'] });
      toast(cn('Registration submitted for advisor approval.', 'تم إرسال التسجيل لموافقة المرشد.'));
    },
    onError: (error) => toast(error instanceof ApiError ? error.code : cn('Registration failed.', 'تعذر التسجيل.')),
  });
  const credits = selected.reduce((sum, section) => sum + section.course.credits, 0);
  return (
    <div className="registration-layout">
      <div>
        <div className="card search-row">
          <Icon name="search" size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={L.searchCourses} />
        </div>
        <AsyncState loading={courses.isLoading} error={courses.error} empty={!courses.data?.length}>
          {courses.data?.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              selected={s.cart.includes(section.id)}
              onToggle={() => toggleCart(section.id)}
            />
          ))}
        </AsyncState>
      </div>
      <div className="card registration-cart">
        <div className="cart-head">
          <Icon name="cart" size={19} />
          {L.cart}
        </div>
        <div className="card-pad">
          {selected.length ? (
            selected.map((section) => (
              <div key={section.id} className="record-row">
                <div>
                  <strong>{section.course.code}</strong>
                  <small>{section.course.nameEn}</small>
                </div>
                <button type="button" className="link-peach" onClick={() => toggleCart(section.id)}>
                  {L.remove}
                </button>
              </div>
            ))
          ) : (
            <p className="empty-text">{L.cartEmpty}</p>
          )}
          <div className="row-between total-row">
            <strong>{L.totalCredits}</strong>
            <strong>{credits}</strong>
          </div>
          <button
            className="btn-primary"
            disabled={!selected.length || submit.isPending}
            onClick={() => submit.mutate()}
          >
            {submit.isPending ? cn('Submitting…', 'جارٍ الإرسال…') : L.submitReg}
          </button>
        </div>
      </div>
    </div>
  );
}

export function StudentCourses() {
  const { L, ar, cn, toast } = useStore();
  const courses = useMyCoursesQuery();
  const client = useQueryClient();
  const drop = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => registrationsApi.drop(id, reason),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['my-courses'] });
      toast(cn('Course dropped.', 'تم حذف المادة.'));
    },
    onError: (error) => toast(error instanceof ApiError ? error.code : 'REQUEST_FAILED'),
  });
  const enrollments = courses.data?.filter((item): item is StudentCourseEnrollment => 'status' in item) ?? [];
  return (
    <AsyncState loading={courses.isLoading} error={courses.error} empty={!enrollments.length}>
      <div className="stack">
        {enrollments.map((enrollment) => (
          <div key={enrollment.id} className="card course-row">
            <div>
              <strong>
                {enrollment.section.course.code} ·{' '}
                {ar ? enrollment.section.course.nameAr : enrollment.section.course.nameEn}
              </strong>
              <small>
                {enrollment.section.sectionCode} · {enrollment.section.course.credits} {L.creditsLabel}
              </small>
            </div>
            <div className="row-actions">
              <button
                type="button"
                className="btn-tint"
                disabled
                title={cn('Syllabus upload is not configured', 'رفع الخطة غير مهيأ')}
              >
                {L.syllabus}
              </button>
              {enrollment.status === 'REGISTERED' && (
                <button
                  type="button"
                  className="btn-danger-soft"
                  disabled={drop.isPending}
                  onClick={() => {
                    const reason = window.prompt(cn('Reason for dropping this course:', 'سبب حذف المادة:'));
                    if (reason) drop.mutate({ id: enrollment.id, reason });
                  }}
                >
                  {L.dropCourse}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </AsyncState>
  );
}

export function StudentGrades() {
  const { L, ar, cn, toast } = useStore();
  const transcript = useTranscriptQuery();
  const appeal = useMutation({
    mutationFn: ({ finalGradeId, reason }: { finalGradeId: string; reason: string }) =>
      gradesApi.appeal(finalGradeId, reason),
    onSuccess: () => toast(cn('Grade appeal submitted.', 'تم إرسال طلب مراجعة الدرجة.')),
    onError: (error) => toast(error instanceof ApiError ? error.code : 'REQUEST_FAILED'),
  });
  const requestAppeal = (finalGradeId: string) => {
    const reason = window.prompt(cn('Explain the reason for this grade appeal:', 'اشرح سبب طلب مراجعة الدرجة:'));
    if (reason) appeal.mutate({ finalGradeId, reason });
  };
  const current = transcript.data?.terms[0];
  return (
    <AsyncState loading={transcript.isLoading} error={transcript.error} empty={!current}>
      <div className="grid-stats">
        <div className="stat">
          <div className="lbl">{L.cumGpa}</div>
          <div className="val">{transcript.data?.student.cumulativeGpa ?? '—'}</div>
        </div>
        <div className="stat">
          <div className="lbl">{L.semGpa}</div>
          <div className="val">{current?.semesterGpa ?? '—'}</div>
        </div>
        <div className="stat">
          <div className="lbl">{L.standing}</div>
          <div className="val status-good">{transcript.data?.student.standing}</div>
        </div>
      </div>
      <div className="tbl-wrap">
        <div className="tbl-head">
          {L.semesterGrades} · {current ? (ar ? current.term.nameAr : current.term.nameEn) : ''}
        </div>
        <table>
          <thead>
            <tr>
              <th>{L.thCode}</th>
              <th>{L.thCourse}</th>
              <th>{L.creditsLabel}</th>
              <th>{L.gradeLabel}</th>
              <th>{L.pointsLabel}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {current?.courses.map((course) => (
              <tr key={course.code}>
                <td>
                  <strong>{course.code}</strong>
                </td>
                <td>{ar ? course.nameAr : course.nameEn}</td>
                <td>{course.credits}</td>
                <td>{course.letterGrade ? <GradeBadge g={course.letterGrade} /> : '—'}</td>
                <td>{course.gradePoints ?? '—'}</td>
                <td>
                  {course.finalGradeId && (
                    <button
                      className="btn-ghost"
                      disabled={appeal.isPending}
                      onClick={() => requestAppeal(course.finalGradeId!)}
                    >
                      {L.gradeAppeal}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AsyncState>
  );
}

export function StudentAttendance() {
  const { L, ar } = useStore();
  const summary = useAttendanceSummaryQuery();
  const total = summary.data?.reduce((sum, row) => sum + row.total, 0) ?? 0;
  const weighted = summary.data?.reduce((sum, row) => sum + row.attendancePercent * row.total, 0) ?? 0;
  const overall = total ? Math.trunc(weighted / total) : 0;
  return (
    <AsyncState loading={summary.isLoading} error={summary.error} empty={!summary.data?.length}>
      <div className="responsive-two-column">
        <div className="card card-pad center">
          <div
            className="progress-ring"
            style={{
              background: `conic-gradient(${overall >= 75 ? '#10B981' : '#EF4444'} 0 ${overall}%,#F1F3F4 ${overall}%)`,
            }}
          >
            <div className="hole">
              <div className="big">{overall}%</div>
              <small>{L.overallAtt}</small>
            </div>
          </div>
        </div>
        <div className="card card-pad">
          <SectionTitle>{L.byCourse}</SectionTitle>
          {summary.data?.map((row) => {
            const color = row.attendancePercent >= row.thresholdPercent ? '#10B981' : '#EF4444';
            return (
              <div key={row.course.code} className="metric-row">
                <div className="row-between">
                  <strong>
                    {row.course.code} · {ar ? row.course.nameAr : row.course.nameEn}
                  </strong>
                  <strong style={{ color }}>{row.attendancePercent}%</strong>
                </div>
                <Bar pct={row.attendancePercent} color={color} />
                <small>
                  {L.absences}: {row.effectiveAbsences} · {L.tardies}: {row.late}
                </small>
              </div>
            );
          })}
        </div>
      </div>
    </AsyncState>
  );
}

export function StudentTranscript() {
  const { L, ar, cn } = useStore();
  const transcript = useTranscriptQuery();
  return (
    <AsyncState loading={transcript.isLoading} error={transcript.error} empty={!transcript.data?.terms.length}>
      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div className="row-between">
          <SectionTitle>{L.gradeHistory}</SectionTitle>
          <button className="btn-teal" onClick={() => window.print()}>
            <Icon name="download" size={15} /> {L.printReceipt}
          </button>
        </div>
        <div className="row-between">
          <div>
            <strong>
              {transcript.data ? (ar ? transcript.data.student.nameAr : transcript.data.student.nameEn) : ''}
            </strong>
            <small>{transcript.data?.student.universityId}</small>
          </div>
          <div>
            <small>{L.cumGpa}</small>
            <strong className="gpa-inline">{transcript.data?.student.cumulativeGpa}</strong>
          </div>
        </div>
      </div>
      {transcript.data?.terms.map((term) => (
        <div className="tbl-wrap" key={term.term.id}>
          <div className="tbl-head row-between">
            <span>{ar ? term.term.nameAr : term.term.nameEn}</span>
            <span>GPA {term.semesterGpa}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>{L.thCode}</th>
                <th>{L.thCourse}</th>
                <th>{L.creditsLabel}</th>
                <th>{L.gradeLabel}</th>
              </tr>
            </thead>
            <tbody>
              {term.courses.map((course) => (
                <tr key={course.code}>
                  <td>{course.code}</td>
                  <td>{ar ? course.nameAr : course.nameEn}</td>
                  <td>{course.credits}</td>
                  <td>{course.letterGrade ?? cn('In progress', 'قيد الدراسة')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </AsyncState>
  );
}
