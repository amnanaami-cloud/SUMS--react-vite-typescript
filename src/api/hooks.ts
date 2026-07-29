import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { academicApi } from './academic';
import { announcementsApi } from './announcements';
import { attendanceApi } from './attendance';
import { gradesApi } from './grades';
import { registrationsApi } from './registrations';
import { reportsApi } from './reports';
import { settingsApi } from './settings';
import { usersApi } from './users';

export const useDashboardQuery = () => useQuery({ queryKey: ['dashboard'], queryFn: academicApi.dashboard });
export const useCoursesQuery = (search = '') =>
  useQuery({ queryKey: ['courses', search], queryFn: () => academicApi.courses(search) });
export const useMyCoursesQuery = () => useQuery({ queryKey: ['my-courses'], queryFn: academicApi.myCourses });
export const useScheduleQuery = () => useQuery({ queryKey: ['schedule'], queryFn: academicApi.schedule });
export const useTermsQuery = () => useQuery({ queryKey: ['terms'], queryFn: academicApi.terms });
export const useCurriculumQuery = () => useQuery({ queryKey: ['curriculum'], queryFn: academicApi.curriculum });
export const useProgressQuery = () =>
  useQuery({ queryKey: ['degree-progress'], queryFn: () => academicApi.degreeProgress() });
export const useStaffQuery = () => useQuery({ queryKey: ['staff'], queryFn: academicApi.staff });
export const useAnalyticsQuery = () => useQuery({ queryKey: ['analytics'], queryFn: academicApi.analytics });
export const useStudentsQuery = (search = '') =>
  useQuery({ queryKey: ['students', search], queryFn: () => usersApi.students(search) });
export const useUsersQuery = (search = '') =>
  useQuery({ queryKey: ['users', search], queryFn: () => usersApi.users(search) });
export const useAuditQuery = () => useQuery({ queryKey: ['audit'], queryFn: usersApi.audit });
export const useTranscriptQuery = () => useQuery({ queryKey: ['transcript'], queryFn: () => gradesApi.transcript() });
export const usePendingGradesQuery = () => useQuery({ queryKey: ['grades', 'pending'], queryFn: gradesApi.pending });
export const useAttendanceSummaryQuery = () =>
  useQuery({ queryKey: ['attendance-summary'], queryFn: attendanceApi.summary });
export const usePendingRegistrationsQuery = () =>
  useQuery({ queryKey: ['registrations', 'pending'], queryFn: registrationsApi.pending });
export const useAnnouncementsQuery = () => useQuery({ queryKey: ['announcements'], queryFn: announcementsApi.list });
export const useReportsQuery = () => useQuery({ queryKey: ['reports'], queryFn: reportsApi.catalog });
export const useSettingsQuery = () => useQuery({ queryKey: ['settings'], queryFn: settingsApi.list });

export function useInvalidateMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
  keys: string[][],
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all(keys.map((key) => client.invalidateQueries({ queryKey: key })));
    },
  });
}
