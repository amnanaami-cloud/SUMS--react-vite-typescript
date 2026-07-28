import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/errors';
import { useDashboardQuery, usePendingRegistrationsQuery } from '../api/hooks';
import { registrationsApi } from '../api/registrations';
import { AsyncState } from '../components/AsyncState';
import { StatGrid } from '../components/ui';
import { useStore } from '../store';

function ApprovalsList() {
  const { L, ar, cn, toast } = useStore();
  const approvals = usePendingRegistrationsQuery();
  const client = useQueryClient();
  const decide = useMutation({
    mutationFn: ({
      id,
      outcome,
      reason,
    }: {
      id: string;
      outcome: 'APPROVED' | 'REJECTED' | 'RETURNED';
      reason: string;
    }) => registrationsApi.decide(id, outcome, reason),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['registrations'] });
      toast(cn('Decision recorded.', 'تم تسجيل القرار.'));
    },
    onError: (error) => toast(error instanceof ApiError ? error.code : 'REQUEST_FAILED'),
  });
  const act = (id: string, outcome: 'APPROVED' | 'REJECTED' | 'RETURNED') => {
    const reason =
      outcome === 'APPROVED'
        ? cn('Academic plan verified', 'تم التحقق من الخطة الأكاديمية')
        : window.prompt(cn('Reason is required:', 'السبب مطلوب:'));
    if (reason) decide.mutate({ id, outcome, reason });
  };
  return (
    <AsyncState loading={approvals.isLoading} error={approvals.error} empty={!approvals.data?.length}>
      <div className="tbl-wrap">
        <div className="tbl-head">{L.pendingApprovals}</div>
        {approvals.data?.map((request) => {
          const user = request.student?.user;
          const name = user
            ? ar
              ? `${user.firstNameAr} ${user.lastNameAr}`
              : `${user.firstNameEn} ${user.lastNameEn}`
            : '—';
          return (
            <div key={request.id} className="approval-row">
              <div>
                <strong>{name}</strong>
                <small>
                  {request.student?.universityId} · {request.items.length} courses · {request.totalCredits}{' '}
                  {L.creditsLabel}
                </small>
                <div className="course-chips">
                  {request.items.map((item) => (
                    <span key={item.id} className="badge">
                      {item.section.course.code}
                    </span>
                  ))}
                </div>
              </div>
              <div className="row-actions">
                <button disabled={decide.isPending} className="btn-teal" onClick={() => act(request.id, 'APPROVED')}>
                  {L.approve}
                </button>
                <button disabled={decide.isPending} className="btn-tint" onClick={() => act(request.id, 'RETURNED')}>
                  {L.requestCorrection}
                </button>
                <button
                  disabled={decide.isPending}
                  className="btn-danger-soft"
                  onClick={() => act(request.id, 'REJECTED')}
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

export function AdvisorDashboard() {
  const { cn } = useStore();
  const dashboard = useDashboardQuery();
  const stat = (key: string) => String(dashboard.data?.stats[key] ?? '—');
  const cards: [string, string, string, string, string][] = [
    ['users', cn('My Advisees', 'طلابي'), stat('advisees'), cn('assigned', 'معيّنون'), '#13737A'],
    [
      'clock',
      cn('Pending Approvals', 'الموافقات المعلقة'),
      stat('pendingApprovals'),
      cn('to review', 'للمراجعة'),
      '#F59E0B',
    ],
    ['alert', cn('At Risk', 'معرضون للخطر'), stat('atRisk'), cn('warning or probation', 'إنذار أو مراقبة'), '#EF4444'],
  ];
  return (
    <AsyncState loading={dashboard.isLoading} error={dashboard.error}>
      <StatGrid items={cards} />
      <ApprovalsList />
    </AsyncState>
  );
}

export function AdvisorApprovals() {
  return <ApprovalsList />;
}
