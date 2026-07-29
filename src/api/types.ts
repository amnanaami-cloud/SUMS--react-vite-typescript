import type { AuthUser } from '../types';

export interface ApiEnvelope<T> {
  data: T;
}
export interface ApiErrorBody {
  statusCode: number;
  code: string;
  message: string;
  details: unknown[];
  requestId?: string;
  timestamp: string;
}
export interface AuthResult {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
}
export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export interface NamedEntity {
  id: string;
  code?: string;
  nameEn: string;
  nameAr: string;
}
export interface Term extends NamedEntity {
  status: string;
  startsOn?: string;
  endsOn?: string;
  registrationStartsAt?: string;
  registrationEndsAt?: string;
  addDropEndsAt?: string;
  withdrawalEndsAt?: string;
  _count?: { sections: number; registrationRequests: number };
}
export interface Course {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  credits: number;
  prerequisites?: Array<{ prerequisite: Pick<Course, 'code' | 'nameEn' | 'nameAr'> }>;
}
export interface Room {
  code: string;
  buildingEn?: string;
  buildingAr?: string;
}
export interface Meeting {
  id: string;
  dayOfWeek: number;
  startsAt: string;
  endsAt: string;
  room: Room | null;
  section?: { id: string; sectionCode: string; course: Course };
}
export interface CourseSection {
  id: string;
  sectionCode: string;
  sectionNo: string;
  capacity: number;
  enrolledCount: number;
  status: string;
  course: Course;
  term: Term;
  meetings: Meeting[];
  instructors?: Array<{
    instructor: { user: { firstNameEn: string; lastNameEn: string; firstNameAr: string; lastNameAr: string } };
  }>;
  _count?: { enrollments: number; attendanceSessions?: number };
}
export interface Dashboard {
  activeTerm: Term | null;
  stats: Record<string, JsonPrimitive>;
}
export interface StudentCourseEnrollment {
  id: string;
  status: string;
  section: CourseSection;
  finalGrade?: { letterGrade: string; gradePoints: string } | null;
}
export interface InstructorCourseAssignment {
  id: string;
  section: CourseSection;
}
export type MyCourse = StudentCourseEnrollment | InstructorCourseAssignment;
export interface Announcement {
  id: string;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  severity: string;
  publishedAt: string | null;
}
export interface AttendanceSummary {
  course: Pick<Course, 'code' | 'nameEn' | 'nameAr'>;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  effectiveAbsences: number;
  attendancePercent: number;
  thresholdPercent: number;
}
export interface GradeSection extends CourseSection {
  assessments: Array<{
    id: string;
    nameEn: string;
    nameAr: string;
    type: string;
    weight: string;
    maxScore: string;
    grades: Array<{ enrollmentId: string; score: string }>;
  }>;
  enrollments: Array<{
    id: string;
    student: {
      universityId: string;
      user: { firstNameEn: string; lastNameEn: string; firstNameAr: string; lastNameAr: string };
    };
    finalGrade: { letterGrade: string; status: string } | null;
  }>;
  gradeSubmissions: Array<{ id: string; status: string }>;
}
export interface GradeSubmission {
  id: string;
  status: string;
  submittedAt: string | null;
  section: CourseSection;
}
export interface TranscriptCourse {
  finalGradeId: string | null;
  publishedAt: string | null;
  code: string;
  nameEn: string;
  nameAr: string;
  credits: number;
  letterGrade: string | null;
  gradePoints: string | null;
}
export interface Transcript {
  student: {
    id: string;
    universityId: string;
    nameEn: string;
    nameAr: string;
    standing: string;
    cumulativeGpa: string;
    program: NamedEntity;
  };
  terms: Array<{ term: Term; courses: TranscriptCourse[]; semesterGpa: string }>;
}
export interface DegreeProgress {
  studentId: string;
  completedCredits: number;
  requiredCredits: number;
  courses: Array<{ code: string; credits: number; grade: string | null }>;
}
export interface RegistrationRequest {
  id: string;
  status: string;
  totalCredits: number;
  submittedAt: string | null;
  term: Term;
  student?: {
    universityId: string;
    user: { firstNameEn: string; lastNameEn: string; firstNameAr: string; lastNameAr: string };
    program: NamedEntity;
  };
  items: Array<{ id: string; sectionId: string; section: { id: string; sectionCode: string; course: Course } }>;
}
export interface StudentListItem {
  id: string;
  universityId: string;
  status: string;
  standing: string;
  cumulativeGpa: string;
  earnedCredits: number;
  currentLevel: number;
  user: { firstNameEn: string; lastNameEn: string; firstNameAr: string; lastNameAr: string; email: string };
  program: NamedEntity & { requiredCredits?: number };
}
export interface UserListItem {
  id: string;
  email: string;
  universityId: string | null;
  employeeId: string | null;
  status: string;
  firstNameEn: string;
  lastNameEn: string;
  lastLoginAt: string | null;
  userRoles: Array<{
    role: { key: string; nameEn: string; nameAr: string };
    scopeType: string | null;
    scopeId: string | null;
  }>;
}
export interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorRole: string | null;
  actorUserId: string | null;
  ipAddress: string | null;
  result: string;
  occurredAt: string;
}
export interface ReportDefinition {
  key: string;
  titleEn: string;
  titleAr: string;
}
export interface ReportData {
  title: string;
  columns: string[];
  rows: Array<Record<string, JsonPrimitive>>;
}
export interface SystemSetting {
  id: string;
  key: string;
  value: JsonValue;
  updatedAt: string;
}
