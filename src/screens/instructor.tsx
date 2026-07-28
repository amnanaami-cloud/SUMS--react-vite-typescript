import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { announcementsApi } from '../api/announcements';
import { attendanceApi } from '../api/attendance';
import { ApiError } from '../api/errors';
import { gradesApi } from '../api/grades';
import { useAnnouncementsQuery, useDashboardQuery, useMyCoursesQuery } from '../api/hooks';
import type { InstructorCourseAssignment } from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { SectionTitle, StatGrid } from '../components/ui';
import { useStore } from '../store';

const today = () => new Date().toISOString().slice(0, 10);

export function InstructorDashboard() {
  const { L, ar, cn, nav } = useStore();
  const dashboard = useDashboardQuery();
  const courses = useMyCoursesQuery();
  const stat = (key: string) => String(dashboard.data?.stats[key] ?? '—');
  const cards: [string, string, string, string, string][] = [
    ['book', L.myClasses, stat('classes'), cn('this term', 'هذا الفصل'), '#13737A'],
    ['users', cn('Total Students', 'مجموع الطلاب'), stat('students'), cn('across classes', 'في الصفوف'), '#FBCA89'],
    ['check', cn('Attendance Due', 'حضور مستحق'), stat('openAttendance'), cn('sessions', 'جلسات'), '#F59E0B'],
    ['chart', cn('Grades Pending', 'درجات معلقة'), stat('pendingGrades'), cn('sheets', 'كشوف'), '#EF4444'],
  ];
  const assignments = courses.data?.filter((item): item is InstructorCourseAssignment => !('status' in item)) ?? [];
  return (
    <AsyncState loading={dashboard.isLoading || courses.isLoading} error={dashboard.error ?? courses.error}>
      <StatGrid items={cards} />
      <SectionTitle>{L.myClasses}</SectionTitle>
      <div className="card-grid">
        {assignments.map(({ id, section }) => (
          <div key={id} className="card card-pad">
            <div className="row-between">
              <div>
                <strong className="teal">{section.course.code}</strong>
                <div>{ar ? section.course.nameAr : section.course.nameEn}</div>
              </div>
              <span className="badge">{section._count?.enrollments ?? section.enrolledCount} students</span>
            </div>
            <small>
              {section.sectionCode} · {section.term.code}
            </small>
            <div className="row-actions">
              <button className="btn-tint" onClick={() => nav('attendance')}>
                {L.m_attendance}
              </button>
              <button className="btn-tint" onClick={() => nav('grades')}>
                {L.gradeEntry}
              </button>
            </div>
          </div>
        ))}
      </div>
    </AsyncState>
  );
}

export function InstructorAttendance() {
  const { L, ar, cn, toast } = useStore();
  const [sectionId, setSectionId] = useState('');
  const [marks, setMarks] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'>>({});
  const sections = useQuery({ queryKey: ['attendance-sections'], queryFn: attendanceApi.sections });
  const selectedSectionId = sectionId || sections.data?.[0]?.sectionId || '';
  const roster = useQuery({
    queryKey: ['attendance-roster', selectedSectionId],
    queryFn: () => attendanceApi.roster(selectedSectionId),
    enabled: Boolean(selectedSectionId),
  });
  const save = useMutation({
    mutationFn: async () => {
      const session = await attendanceApi.createSession(
        selectedSectionId,
        today(),
        `${new Date().getUTCHours().toString().padStart(2, '0')}:00:00`,
      );
      const records = (roster.data ?? []).map((enrollment) => ({
        enrollmentId: enrollment.id,
        status: marks[enrollment.id] ?? 'PRESENT',
      }));
      return attendanceApi.save(session.id, records);
    },
    onSuccess: () => toast(cn('Attendance submitted.', 'تم إرسال الحضور.')),
    onError: (error) => toast(error instanceof ApiError ? error.code : 'REQUEST_FAILED'),
  });
  const markAll = (status: 'PRESENT' | 'ABSENT') =>
    setMarks(Object.fromEntries((roster.data ?? []).map((entry) => [entry.id, status])));
  const statuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const;
  return (
    <>
      <div className="card toolbar">
        <select
          value={selectedSectionId}
          onChange={(event) => {
            setSectionId(event.target.value);
            setMarks({});
          }}
        >
          {sections.data?.map((assignment) => (
            <option key={assignment.sectionId} value={assignment.sectionId}>
              {assignment.section.course.code} · {assignment.section.sectionCode}
            </option>
          ))}
        </select>
        <div className="row-actions">
          <button className="btn-tint" onClick={() => markAll('PRESENT')}>
            {L.markAllPresent}
          </button>
          <button className="btn-danger-soft" onClick={() => markAll('ABSENT')}>
            {L.markAllAbsent}
          </button>
        </div>
      </div>
      <AsyncState
        loading={sections.isLoading || roster.isLoading}
        error={sections.error ?? roster.error}
        empty={!roster.data?.length}
      >
        <div className="tbl-wrap">
          {roster.data?.map((enrollment) => {
            const user = enrollment.student.user;
            const name = ar ? `${user.firstNameAr} ${user.lastNameAr}` : `${user.firstNameEn} ${user.lastNameEn}`;
            return (
              <div key={enrollment.id} className="roster-row">
                <div>
                  <strong>{name}</strong>
                  <small>{enrollment.student.universityId}</small>
                </div>
                <div className="row-actions">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      className={(marks[enrollment.id] ?? 'PRESENT') === status ? 'btn-teal' : 'btn-tint'}
                      onClick={() => setMarks((previous) => ({ ...previous, [enrollment.id]: status }))}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          <div className="table-actions">
            <button
              className="btn-primary inline"
              disabled={!roster.data?.length || save.isPending}
              onClick={() => save.mutate()}
            >
              {save.isPending ? cn('Submitting…', 'جارٍ الإرسال…') : L.submitAttendance}
            </button>
          </div>
        </div>
      </AsyncState>
    </>
  );
}

export function InstructorGrades() {
  const { L, ar, cn, toast } = useStore();
  const [sectionId, setSectionId] = useState('');
  const [assessmentId, setAssessmentId] = useState('');
  const [scores, setScores] = useState<Record<string, string>>({});
  const courses = useMyCoursesQuery();
  const assignments = courses.data?.filter((item): item is InstructorCourseAssignment => !('status' in item)) ?? [];
  const selectedSectionId = sectionId || assignments[0]?.section.id || '';
  const section = useQuery({
    queryKey: ['grade-section', selectedSectionId],
    queryFn: () => gradesApi.section(selectedSectionId),
    enabled: Boolean(selectedSectionId),
  });
  const selectedAssessmentId = section.data?.assessments.some((item) => item.id === assessmentId)
    ? assessmentId
    : (section.data?.assessments[0]?.id ?? '');
  const assessment = section.data?.assessments.find((item) => item.id === selectedAssessmentId);
  const client = useQueryClient();
  const save = useMutation({
    mutationFn: () =>
      gradesApi.saveScores(
        selectedAssessmentId,
        (section.data?.enrollments ?? []).map((enrollment) => ({
          enrollmentId: enrollment.id,
          score: Number(
            scores[enrollment.id] ??
              assessment?.grades.find((grade) => grade.enrollmentId === enrollment.id)?.score ??
              0,
          ),
        })),
      ),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['grade-section', selectedSectionId] });
      toast(cn('Grades saved.', 'تم حفظ الدرجات.'));
    },
    onError: (error) => toast(error instanceof ApiError ? error.code : 'REQUEST_FAILED'),
  });
  const submit = useMutation({
    mutationFn: () => gradesApi.submit(selectedSectionId),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['grade-section', selectedSectionId] });
      toast(cn('Grade sheet submitted.', 'تم إرسال كشف الدرجات.'));
    },
    onError: (error) => toast(error instanceof ApiError ? error.code : 'REQUEST_FAILED'),
  });
  return (
    <>
      <div className="card toolbar">
        <select
          value={selectedSectionId}
          onChange={(event) => {
            setSectionId(event.target.value);
            setAssessmentId('');
            setScores({});
          }}
        >
          {assignments.map(({ section: item }) => (
            <option key={item.id} value={item.id}>
              {item.course.code} · {item.sectionCode}
            </option>
          ))}
        </select>
        <select
          value={selectedAssessmentId}
          onChange={(event) => {
            setAssessmentId(event.target.value);
            setScores({});
          }}
        >
          {section.data?.assessments.map((item) => (
            <option key={item.id} value={item.id}>
              {ar ? item.nameAr : item.nameEn} ({item.weight}%)
            </option>
          ))}
        </select>
      </div>
      <AsyncState
        loading={courses.isLoading || section.isLoading}
        error={courses.error ?? section.error}
        empty={!section.data?.enrollments.length || !assessment}
      >
        <div className="tbl-wrap">
          <div className="tbl-head">
            {section.data?.course.code} · {assessment ? (ar ? assessment.nameAr : assessment.nameEn) : L.gradeEntry}
          </div>
          {section.data?.enrollments.map((enrollment) => {
            const user = enrollment.student.user;
            const name = ar ? `${user.firstNameAr} ${user.lastNameAr}` : `${user.firstNameEn} ${user.lastNameEn}`;
            const savedScore = assessment?.grades.find((grade) => grade.enrollmentId === enrollment.id)?.score ?? '';
            return (
              <div key={enrollment.id} className="roster-row">
                <div>
                  <strong>{name}</strong>
                  <small>{enrollment.student.universityId}</small>
                </div>
                <label>
                  <input
                    type="number"
                    min="0"
                    max={assessment?.maxScore}
                    step="0.01"
                    value={scores[enrollment.id] ?? savedScore}
                    onChange={(event) =>
                      setScores((previous) => ({ ...previous, [enrollment.id]: event.target.value }))
                    }
                  />{' '}
                  / {assessment?.maxScore}
                </label>
              </div>
            );
          })}
          <div className="table-actions row-actions">
            <button className="btn-tint" disabled={!assessment || save.isPending} onClick={() => save.mutate()}>
              {L.saveGrades}
            </button>
            <button
              className="btn-primary inline"
              disabled={!section.data?.assessments.length || submit.isPending}
              onClick={() => submit.mutate()}
            >
              {cn('Submit grade sheet', 'إرسال كشف الدرجات')}
            </button>
          </div>
        </div>
      </AsyncState>
    </>
  );
}

export function InstructorAnnouncements() {
  const { L, ar, cn, toast } = useStore();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sectionId, setSectionId] = useState('');
  const courses = useMyCoursesQuery();
  const announcements = useAnnouncementsQuery();
  const client = useQueryClient();
  const assignments = courses.data?.filter((item): item is InstructorCourseAssignment => !('status' in item)) ?? [];
  const selectedSectionId = sectionId || assignments[0]?.section.id || '';
  const create = useMutation({
    mutationFn: () =>
      announcementsApi.create({
        titleEn: title,
        titleAr: title,
        bodyEn: message,
        bodyAr: message,
        severity: 'INFO',
        audienceType: 'SECTION',
        sectionId: selectedSectionId,
      }),
    onSuccess: async () => {
      setTitle('');
      setMessage('');
      await client.invalidateQueries({ queryKey: ['announcements'] });
      toast(cn('Announcement published.', 'تم نشر الإعلان.'));
    },
    onError: (error) => toast(error instanceof ApiError ? error.code : 'REQUEST_FAILED'),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate();
  };
  return (
    <div className="responsive-two-column">
      <form className="card card-pad" onSubmit={submit}>
        <SectionTitle>{L.createAnn}</SectionTitle>
        <label className="field-label">{L.annTitle}</label>
        <input
          className="inp"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          maxLength={200}
        />
        <label className="field-label">{L.annMsg}</label>
        <textarea
          className="inp"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
          maxLength={5000}
        />
        <label className="field-label">{L.annClasses}</label>
        <select value={selectedSectionId} onChange={(event) => setSectionId(event.target.value)} required>
          {assignments.map(({ section }) => (
            <option key={section.id} value={section.id}>
              {section.course.code} · {section.sectionCode}
            </option>
          ))}
        </select>
        <button className="btn-primary" disabled={create.isPending || !selectedSectionId}>
          {L.publish}
        </button>
      </form>
      <div className="card card-pad">
        <SectionTitle>{L.pastAnn}</SectionTitle>
        <AsyncState loading={announcements.isLoading} error={announcements.error} empty={!announcements.data?.length}>
          {announcements.data?.map((item) => (
            <div key={item.id} className="announcement-row">
              <small>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : ''}</small>
              <strong>{ar ? item.titleAr : item.titleEn}</strong>
              <p>{ar ? item.bodyAr : item.bodyEn}</p>
            </div>
          ))}
        </AsyncState>
      </div>
    </div>
  );
}
