import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/errors';
import { gradesApi } from '../api/grades';
import { useAnalyticsQuery, useDashboardQuery, usePendingGradesQuery, useStaffQuery } from '../api/hooks';
import { AsyncState } from '../components/AsyncState';
import { Bar, SectionTitle, StatGrid } from '../components/ui';
import { useStore } from '../store';

const dashboardCards = (
  stats: Record<string, string | number | boolean | null> | undefined,
  cn: (en: string, ar: string) => string,
): [string, string, string, string, string][] => [
  ['users', cn('Students', 'الطلاب'), String(stats?.students ?? '—'), cn('current scope', 'النطاق الحالي'), '#13737A'],
  ['book', cn('Courses', 'المواد'), String(stats?.courses ?? '—'), cn('active catalog', 'دليل نشط'), '#3B82F6'],
  ['layers', cn('Sections', 'الشعب'), String(stats?.sections ?? '—'), cn('current term', 'الفصل الحالي'), '#D4AF37'],
  [
    'clock',
    cn('Pending Registrations', 'تسجيلات معلقة'),
    String(stats?.pendingRegistrations ?? '—'),
    cn('requires action', 'تتطلب إجراء'),
    '#F59E0B',
  ],
];

export function DeanDashboard() {
  const { ar, cn } = useStore();
  const dashboard = useDashboardQuery();
  const staff = useStaffQuery();
  return (
    <AsyncState loading={dashboard.isLoading || staff.isLoading} error={dashboard.error ?? staff.error}>
      <StatGrid items={dashboardCards(dashboard.data?.stats, cn)} />
      <div className="card card-pad">
        <SectionTitle>{cn('Faculty overview', 'نظرة عامة على الكلية')}</SectionTitle>
        {staff.data?.slice(0, 8).map((member) => (
          <div className="record-row" key={member.id}>
            <div>
              <strong>
                {ar
                  ? `${member.user.firstNameAr} ${member.user.lastNameAr}`
                  : `${member.user.firstNameEn} ${member.user.lastNameEn}`}
              </strong>
              <small>
                {ar ? member.department.nameAr : member.department.nameEn} · {member.employeeId}
              </small>
            </div>
            <span>
              {member._count.sectionAssignments} {cn('sections', 'شعب')}
            </span>
          </div>
        ))}
      </div>
    </AsyncState>
  );
}

export function DeanAnalytics() {
  const { L, cn } = useStore();
  const analytics = useAnalyticsQuery();
  const max = Math.max(1, ...(analytics.data?.standing.map((entry) => entry._count) ?? [1]));
  return (
    <AsyncState loading={analytics.isLoading} error={analytics.error}>
      <div className="responsive-two-column">
        <div className="card card-pad">
          <SectionTitle>{L.gpaDistribution}</SectionTitle>
          {analytics.data?.standing.map((entry) => (
            <div className="metric-row" key={entry.standing}>
              <div className="row-between">
                <strong>{entry.standing}</strong>
                <span>{entry._count}</span>
              </div>
              <Bar pct={(entry._count / max) * 100} color="#D4AF37" />
            </div>
          ))}
        </div>
        <div className="card card-pad">
          <SectionTitle>{cn('Student status', 'حالة الطلاب')}</SectionTitle>
          {analytics.data?.status.map((entry) => (
            <div className="record-row" key={entry.status}>
              <strong>{entry.status}</strong>
              <span>{entry._count}</span>
            </div>
          ))}
        </div>
      </div>
    </AsyncState>
  );
}

export function DeanPlanning() {
  const { cn } = useStore();
  const dashboard = useDashboardQuery();
  const analytics = useAnalyticsQuery();
  return (
    <AsyncState loading={dashboard.isLoading || analytics.isLoading} error={dashboard.error ?? analytics.error}>
      <div className="card card-pad">
        <SectionTitle>{cn('Evidence base for planning', 'قاعدة الأدلة للتخطيط')}</SectionTitle>
        <p>
          {cn(
            'These live, faculty-scoped metrics are available for planning exports. Strategic targets require an approved policy record and are not inferred by the interface.',
            'هذه المؤشرات الحية والمقيدة بنطاق الكلية متاحة لتقارير التخطيط. الأهداف الاستراتيجية تحتاج سياسة معتمدة ولا تستنتجها الواجهة.',
          )}
        </p>
        <StatGrid items={dashboardCards(dashboard.data?.stats, cn)} />
      </div>
    </AsyncState>
  );
}

export function DeanSettings() {
  const { cn } = useStore();
  return (
    <div className="card card-pad">
      <SectionTitle>{cn('Governance boundary', 'حدود الحوكمة')}</SectionTitle>
      <p>
        {cn(
          'University settings are read and changed by the System Administrator. Dean access is intentionally read-only through scoped reports.',
          'يقرأ مدير النظام إعدادات الجامعة ويغيرها. وصول العميد للقراءة فقط عبر التقارير المقيدة بالنطاق.',
        )}
      </p>
    </div>
  );
}

function DeptApprovalsBlock() {
  const { L, ar, cn, toast } = useStore();
  const pending = usePendingGradesQuery();
  const client = useQueryClient();
  const publish = useMutation({
    mutationFn: gradesApi.publish,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['grades', 'pending'] });
      toast(cn('Grades published.', 'تم نشر الدرجات.'));
    },
    onError: (error) => toast(error instanceof ApiError ? error.code : 'REQUEST_FAILED'),
  });
  const returnSubmission = useMutation({
    mutationFn: ({ sectionId, reason }: { sectionId: string; reason: string }) =>
      gradesApi.returnSubmission(sectionId, reason),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['grades', 'pending'] });
      toast(cn('Grade sheet returned.', 'تمت إعادة كشف الدرجات.'));
    },
    onError: (error) => toast(error instanceof ApiError ? error.code : 'REQUEST_FAILED'),
  });
  const sendBack = (sectionId: string) => {
    const reason = window.prompt(cn('Reason for returning this grade sheet:', 'سبب إعادة كشف الدرجات:'));
    if (reason) returnSubmission.mutate({ sectionId, reason });
  };
  return (
    <AsyncState loading={pending.isLoading} error={pending.error} empty={!pending.data?.length}>
      <div className="tbl-wrap">
        <div className="tbl-head">{L.gradeApprovals}</div>
        {pending.data?.map((submission) => {
          const section = submission.section;
          const instructor = section.instructors?.[0]?.instructor.user;
          return (
            <div key={submission.id} className="approval-row">
              <div>
                <strong>
                  {section.course.code} · {ar ? section.course.nameAr : section.course.nameEn}
                </strong>
                <small>
                  {instructor
                    ? ar
                      ? `${instructor.firstNameAr} ${instructor.lastNameAr}`
                      : `${instructor.firstNameEn} ${instructor.lastNameEn}`
                    : '—'}{' '}
                  · {section._count?.enrollments ?? 0} students
                </small>
              </div>
              <div className="row-actions">
                <button
                  className="btn-teal"
                  disabled={publish.isPending || returnSubmission.isPending}
                  onClick={() => publish.mutate(section.id)}
                >
                  {L.approve}
                </button>
                <button
                  className="btn-danger-soft"
                  disabled={publish.isPending || returnSubmission.isPending}
                  onClick={() => sendBack(section.id)}
                >
                  {L.reject}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </AsyncState>
  );
}

export function DeptDashboard() {
  const { cn } = useStore();
  const dashboard = useDashboardQuery();
  return (
    <AsyncState loading={dashboard.isLoading} error={dashboard.error}>
      <StatGrid items={dashboardCards(dashboard.data?.stats, cn)} />
      <DeptApprovalsBlock />
    </AsyncState>
  );
}
export function DeptApprovals() {
  return <DeptApprovalsBlock />;
}

export function DeptStaff() {
  const { L, ar } = useStore();
  const staff = useStaffQuery();
  return (
    <AsyncState loading={staff.isLoading} error={staff.error} empty={!staff.data?.length}>
      <div className="card-grid">
        {staff.data?.map((member) => (
          <div key={member.id} className="card card-pad center">
            <div className="avatar profile-avatar">
              {(ar ? member.user.firstNameAr : member.user.firstNameEn).slice(0, 1)}
            </div>
            <strong>
              {ar
                ? `${member.user.firstNameAr} ${member.user.lastNameAr}`
                : `${member.user.firstNameEn} ${member.user.lastNameEn}`}
            </strong>
            <small>{member.titleEn ?? member.employeeId}</small>
            <div className="row-actions">
              <span>
                {member._count.sectionAssignments} {L.m_courses}
              </span>
              <span>
                {member._count.advisorAssignments} {L.m_students}
              </span>
            </div>
          </div>
        ))}
      </div>
    </AsyncState>
  );
}
