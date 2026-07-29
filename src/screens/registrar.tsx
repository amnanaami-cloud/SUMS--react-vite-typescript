import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/errors';
import { useCoursesQuery, useDashboardQuery, usePendingRegistrationsQuery, useTermsQuery } from '../api/hooks';
import { registrationsApi } from '../api/registrations';
import { AsyncState } from '../components/AsyncState';
import { SectionTitle, StatGrid } from '../components/ui';
import { useStore } from '../store';

export function RegistrarDashboard() {
  const { L, ar, cn } = useStore();
  const dashboard = useDashboardQuery();
  const terms = useTermsQuery();
  const stat = (key: string) => String(dashboard.data?.stats[key] ?? '—');
  const cards: [string, string, string, string, string][] = [
    ['users', cn('Total Students', 'مجموع الطلاب'), stat('students'), cn('active records', 'سجلات نشطة'), '#13737A'],
    [
      'clock',
      cn('Pending Registrations', 'تسجيلات معلقة'),
      stat('pendingRegistrations'),
      cn('to process', 'للمعالجة'),
      '#F59E0B',
    ],
    ['book', cn('Courses Offered', 'مواد مطروحة'), stat('courses'), cn('active catalog', 'دليل نشط'), '#3B82F6'],
    ['layers', cn('Sections', 'الشعب'), stat('sections'), cn('current term', 'الفصل الحالي'), '#D4AF37'],
  ];
  return (
    <AsyncState loading={dashboard.isLoading || terms.isLoading} error={dashboard.error ?? terms.error}>
      <StatGrid items={cards} />
      <div className="card card-pad">
        <SectionTitle>{L.importantDates}</SectionTitle>
        {terms.data?.slice(0, 3).map((term) => (
          <div key={term.id} className="record-row">
            <div>
              <strong>{ar ? term.nameAr : term.nameEn}</strong>
              <small>{term.status}</small>
            </div>
            <small>
              {term.startsOn ? new Date(term.startsOn).toLocaleDateString() : ''} –{' '}
              {term.endsOn ? new Date(term.endsOn).toLocaleDateString() : ''}
            </small>
          </div>
        ))}
      </div>
    </AsyncState>
  );
}

export function RegistrarCourses() {
  const { L, ar, cn } = useStore();
  const courses = useCoursesQuery();
  return (
    <AsyncState loading={courses.isLoading} error={courses.error} empty={!courses.data?.length}>
      <div className="tbl-wrap">
        <div className="tbl-head row-between">
          <span>{cn('Offered course sections', 'شعب المواد المطروحة')}</span>
          <button
            className="btn-teal"
            disabled
            title={cn('Use the documented API to create sections', 'استخدم الواجهة الموثقة لإنشاء الشعب')}
          >
            + {L.addCourse}
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>{L.thCode}</th>
              <th>{L.thCourse}</th>
              <th>{L.sectionsCol}</th>
              <th>{L.enrolledCol}</th>
              <th>{cn('Capacity', 'السعة')}</th>
              <th>{L.thStatus}</th>
            </tr>
          </thead>
          <tbody>
            {courses.data?.map((section) => (
              <tr key={section.id}>
                <td>
                  <strong>{section.course.code}</strong>
                </td>
                <td>{ar ? section.course.nameAr : section.course.nameEn}</td>
                <td>{section.sectionNo}</td>
                <td>{section.enrolledCount}</td>
                <td>{section.capacity}</td>
                <td>
                  <span className="badge">{section.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AsyncState>
  );
}

export function RegistrarMonitoring() {
  const { L, ar, cn, toast } = useStore();
  const registrations = usePendingRegistrationsQuery();
  const client = useQueryClient();
  const finalize = useMutation({
    mutationFn: registrationsApi.finalize,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['registrations'] });
      toast(cn('Registration finalized.', 'تم اعتماد التسجيل.'));
    },
    onError: (error) => toast(error instanceof ApiError ? error.code : 'REQUEST_FAILED'),
  });
  return (
    <AsyncState loading={registrations.isLoading} error={registrations.error} empty={!registrations.data?.length}>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>{L.thName}</th>
              <th>{L.creditsLabel}</th>
              <th>{L.thStatus}</th>
              <th>{L.thCourse}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {registrations.data?.map((request) => {
              const user = request.student?.user;
              return (
                <tr key={request.id}>
                  <td>
                    <strong>
                      {user
                        ? ar
                          ? `${user.firstNameAr} ${user.lastNameAr}`
                          : `${user.firstNameEn} ${user.lastNameEn}`
                        : '—'}
                    </strong>
                    <small>{request.student?.universityId}</small>
                  </td>
                  <td>{request.totalCredits}</td>
                  <td>
                    <span className="badge">{request.status}</span>
                  </td>
                  <td>{request.items.map((item) => item.section.course.code).join(', ')}</td>
                  <td>
                    <button
                      className="btn-teal"
                      disabled={request.status !== 'APPROVED' || finalize.isPending}
                      onClick={() => finalize.mutate(request.id)}
                    >
                      {L.finalize}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AsyncState>
  );
}
