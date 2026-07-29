-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RoleKey" AS ENUM ('student', 'instructor', 'advisor', 'registrar', 'admin', 'depthead', 'coordinator', 'dean', 'uniregistrar');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'LOCKED', 'DISABLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ON_LEAVE', 'GRADUATED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TermType" AS ENUM ('FIRST', 'SECOND', 'SUMMER');

-- CreateEnum
CREATE TYPE "TermStatus" AS ENUM ('DRAFT', 'REGISTRATION_OPEN', 'ACTIVE', 'GRADING', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CourseType" AS ENUM ('THEORY', 'LABORATORY', 'MIXED');

-- CreateEnum
CREATE TYPE "SectionStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "InstructorAssignmentRole" AS ENUM ('PRIMARY', 'CO_INSTRUCTOR');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('DRAFT', 'PENDING_ADVISOR', 'RETURNED', 'APPROVED', 'REJECTED', 'FINALIZED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RegistrationItemStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'REGISTERED', 'WAITLISTED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING_ADVISOR_APPROVAL', 'REGISTERED', 'WAITLISTED', 'DROPPED', 'WITHDRAWN', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ApprovalOutcome" AS ENUM ('APPROVED', 'REJECTED', 'RETURNED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateEnum
CREATE TYPE "AttendanceSessionStatus" AS ENUM ('OPEN', 'SUBMITTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('COURSEWORK', 'MIDTERM', 'FINAL', 'OTHER');

-- CreateEnum
CREATE TYPE "GradeWorkflowStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'PUBLISHED', 'RETURNED');

-- CreateEnum
CREATE TYPE "GradingModel" AS ENUM ('ABSOLUTE', 'RELATIVE');

-- CreateEnum
CREATE TYPE "FinalResultCode" AS ENUM ('LETTER', 'W', 'I', 'P', 'F');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RETURNED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StandingCode" AS ENUM ('GOOD_STANDING', 'WARNING', 'PROBATION');

-- CreateEnum
CREATE TYPE "AudienceType" AS ENUM ('ALL', 'ROLE', 'FACULTY', 'DEPARTMENT', 'PROGRAM', 'SECTION', 'USER');

-- CreateEnum
CREATE TYPE "NotificationSeverity" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AuditResult" AS ENUM ('SUCCESS', 'FAILURE');

-- CreateEnum
CREATE TYPE "HoldType" AS ENUM ('ACADEMIC', 'DISCIPLINARY', 'MISSING_DOCUMENTS', 'ADMINISTRATIVE');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('JSON', 'CSV', 'PDF', 'XLSX');

-- CreateEnum
CREATE TYPE "TranscriptStatus" AS ENUM ('VALID', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "universityId" VARCHAR(10),
    "employeeId" VARCHAR(9),
    "passwordHash" TEXT NOT NULL,
    "firstNameEn" VARCHAR(100) NOT NULL,
    "lastNameEn" VARCHAR(100) NOT NULL,
    "firstNameAr" VARCHAR(100) NOT NULL,
    "lastNameAr" VARCHAR(100) NOT NULL,
    "preferredLanguage" VARCHAR(2) NOT NULL DEFAULT 'en',
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "key" "RoleKey" NOT NULL,
    "nameEn" VARCHAR(100) NOT NULL,
    "nameAr" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" UUID NOT NULL,
    "key" VARCHAR(120) NOT NULL,
    "resource" VARCHAR(80) NOT NULL,
    "action" VARCHAR(40) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "scopeType" VARCHAR(30),
    "scopeId" UUID,
    "assignedBy" UUID,
    "reason" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "activeRole" "RoleKey" NOT NULL,
    "ipAddress" VARCHAR(64),
    "userAgent" VARCHAR(500),
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokeReason" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "requestedIp" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "identifier" VARCHAR(254) NOT NULL,
    "success" BOOLEAN NOT NULL,
    "failureCode" VARCHAR(80),
    "ipAddress" VARCHAR(64),
    "userAgent" VARCHAR(500),
    "requestId" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faculty" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "nameEn" VARCHAR(200) NOT NULL,
    "nameAr" VARCHAR(200) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" UUID NOT NULL,
    "facultyId" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "nameEn" VARCHAR(200) NOT NULL,
    "nameAr" VARCHAR(200) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicProgram" (
    "id" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "nameEn" VARCHAR(200) NOT NULL,
    "nameAr" VARCHAR(200) NOT NULL,
    "degreeNameEn" VARCHAR(100) NOT NULL,
    "degreeNameAr" VARCHAR(100) NOT NULL,
    "requiredCredits" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" UUID NOT NULL,
    "code" VARCHAR(9) NOT NULL,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicTerm" (
    "id" UUID NOT NULL,
    "academicYearId" UUID NOT NULL,
    "code" VARCHAR(8) NOT NULL,
    "type" "TermType" NOT NULL,
    "nameEn" VARCHAR(100) NOT NULL,
    "nameAr" VARCHAR(100) NOT NULL,
    "status" "TermStatus" NOT NULL DEFAULT 'DRAFT',
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,
    "registrationStartsAt" TIMESTAMP(3) NOT NULL,
    "registrationEndsAt" TIMESTAMP(3) NOT NULL,
    "addDropEndsAt" TIMESTAMP(3) NOT NULL,
    "withdrawalEndsAt" TIMESTAMP(3) NOT NULL,
    "appealEndsAt" TIMESTAMP(3),
    "gradeSubmissionEndsAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" UUID NOT NULL,
    "buildingCode" VARCHAR(30) NOT NULL,
    "roomCode" VARCHAR(30) NOT NULL,
    "nameEn" VARCHAR(120),
    "nameAr" VARCHAR(120),
    "capacity" INTEGER NOT NULL,
    "isLaboratory" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" UUID NOT NULL,
    "key" VARCHAR(120) NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicPolicy" (
    "id" UUID NOT NULL,
    "key" VARCHAR(120) NOT NULL,
    "version" INTEGER NOT NULL,
    "termId" UUID,
    "value" JSONB NOT NULL,
    "sourceRef" VARCHAR(100) NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "programId" UUID NOT NULL,
    "universityId" VARCHAR(10) NOT NULL,
    "genderPrefix" INTEGER NOT NULL,
    "admissionYear" INTEGER NOT NULL,
    "admissionDate" DATE NOT NULL,
    "currentLevel" INTEGER NOT NULL,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "earnedCredits" INTEGER NOT NULL DEFAULT 0,
    "semesterGpa" DECIMAL(4,2),
    "cumulativeGpa" DECIMAL(4,2),
    "standing" "StandingCode" NOT NULL DEFAULT 'GOOD_STANDING',
    "phone" VARCHAR(30),
    "addressEn" VARCHAR(500),
    "addressAr" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "departmentId" UUID,
    "employeeId" VARCHAR(9) NOT NULL,
    "titleEn" VARCHAR(120),
    "titleAr" VARCHAR(120),
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "phone" VARCHAR(30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvisorAssignment" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "advisorId" UUID NOT NULL,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdvisorAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentStatusHistory" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "fromStatus" "StudentStatus",
    "toStatus" "StudentStatus" NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "changedBy" UUID NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicStandingHistory" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "termId" UUID NOT NULL,
    "standing" "StandingCode" NOT NULL,
    "semesterGpa" DECIMAL(4,2) NOT NULL,
    "cumulativeGpa" DECIMAL(4,2) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicStandingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "nameEn" VARCHAR(200) NOT NULL,
    "nameAr" VARCHAR(200) NOT NULL,
    "descriptionEn" TEXT,
    "descriptionAr" TEXT,
    "credits" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "type" "CourseType" NOT NULL DEFAULT 'THEORY',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoursePrerequisite" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "prerequisiteId" UUID NOT NULL,
    "minimumGrade" VARCHAR(3) NOT NULL DEFAULT 'C',
    "isCorequisite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoursePrerequisite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Curriculum" (
    "id" UUID NOT NULL,
    "programId" UUID NOT NULL,
    "effectiveTermId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "nameEn" VARCHAR(200) NOT NULL,
    "nameAr" VARCHAR(200) NOT NULL,
    "totalCredits" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Curriculum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumCourse" (
    "id" UUID NOT NULL,
    "curriculumId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "category" VARCHAR(60) NOT NULL,
    "minimumGrade" VARCHAR(3),
    "recommendedLevel" INTEGER,
    "required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CurriculumCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseSection" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "termId" UUID NOT NULL,
    "sectionNo" VARCHAR(10) NOT NULL,
    "sectionCode" VARCHAR(50) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "enrolledCount" INTEGER NOT NULL DEFAULT 0,
    "status" "SectionStatus" NOT NULL DEFAULT 'DRAFT',
    "gradingModel" "GradingModel" NOT NULL DEFAULT 'ABSOLUTE',
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" VARCHAR(500),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionMeeting" (
    "id" UUID NOT NULL,
    "sectionId" UUID NOT NULL,
    "roomId" UUID NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startsAt" TIME(0) NOT NULL,
    "endsAt" TIME(0) NOT NULL,
    "isLab" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SectionMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstructorSectionAssignment" (
    "id" UUID NOT NULL,
    "sectionId" UUID NOT NULL,
    "instructorId" UUID NOT NULL,
    "role" "InstructorAssignmentRole" NOT NULL,
    "assignedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstructorSectionAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationHold" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "type" "HoldType" NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationHold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationRequest" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "termId" UUID NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'DRAFT',
    "totalCredits" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),
    "finalizedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationItem" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "sectionId" UUID NOT NULL,
    "status" "RegistrationItemStatus" NOT NULL DEFAULT 'REQUESTED',
    "validation" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "sectionId" UUID NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'REGISTERED',
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "droppedAt" TIMESTAMP(3),
    "withdrawalAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "sectionId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promotedAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddDropRequest" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "enrollmentId" UUID,
    "action" VARCHAR(20) NOT NULL,
    "reason" VARCHAR(500),
    "status" "RequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AddDropRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalDecision" (
    "id" UUID NOT NULL,
    "registrationRequestId" UUID NOT NULL,
    "actorUserId" UUID NOT NULL,
    "actorRole" "RoleKey" NOT NULL,
    "outcome" "ApprovalOutcome" NOT NULL,
    "reason" VARCHAR(1000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceSession" (
    "id" UUID NOT NULL,
    "sectionId" UUID NOT NULL,
    "sessionDate" DATE NOT NULL,
    "startsAt" TIME(0) NOT NULL,
    "status" "AttendanceSessionStatus" NOT NULL DEFAULT 'OPEN',
    "createdBy" UUID NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "note" VARCHAR(500),
    "evidenceRef" VARCHAR(500),
    "markedBy" UUID NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceAdjustment" (
    "id" UUID NOT NULL,
    "recordId" UUID NOT NULL,
    "fromStatus" "AttendanceStatus" NOT NULL,
    "toStatus" "AttendanceStatus" NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "requestedBy" UUID NOT NULL,
    "approvedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradingPolicy" (
    "id" UUID NOT NULL,
    "nameEn" VARCHAR(200) NOT NULL,
    "nameAr" VARCHAR(200) NOT NULL,
    "model" "GradingModel" NOT NULL,
    "thresholds" JSONB NOT NULL,
    "failFloor" DECIMAL(5,2) NOT NULL,
    "minPopulation" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sourceRef" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradingPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" UUID NOT NULL,
    "sectionId" UUID NOT NULL,
    "nameEn" VARCHAR(200) NOT NULL,
    "nameAr" VARCHAR(200) NOT NULL,
    "type" "AssessmentType" NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "maxScore" DECIMAL(8,2) NOT NULL,
    "dueAt" TIMESTAMP(3),
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentGrade" (
    "id" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "score" DECIMAL(8,2) NOT NULL,
    "enteredBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeSubmission" (
    "id" UUID NOT NULL,
    "sectionId" UUID NOT NULL,
    "status" "GradeWorkflowStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedBy" UUID,
    "submittedAt" TIMESTAMP(3),
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "returnReason" VARCHAR(500),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradeSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinalGrade" (
    "id" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "rawScore" DECIMAL(8,2),
    "standardizedScore" DECIMAL(8,4),
    "resultCode" "FinalResultCode" NOT NULL DEFAULT 'LETTER',
    "letterGrade" VARCHAR(3),
    "gradePoints" DECIMAL(3,2),
    "status" "GradeWorkflowStatus" NOT NULL DEFAULT 'DRAFT',
    "effectiveForGpa" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinalGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeChangeRequest" (
    "id" UUID NOT NULL,
    "finalGradeId" UUID NOT NULL,
    "requestedBy" UUID NOT NULL,
    "oldValue" JSONB NOT NULL,
    "proposedValue" JSONB NOT NULL,
    "reason" VARCHAR(1000) NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "departmentHeadDecisionBy" UUID,
    "registrarDecisionBy" UUID,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradeChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeAppeal" (
    "id" UUID NOT NULL,
    "finalGradeId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "reason" VARCHAR(1500) NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "instructorResponse" VARCHAR(1500),
    "departmentDecision" VARCHAR(1500),
    "registrarDecision" VARCHAR(1500),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradeAppeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" UUID NOT NULL,
    "titleEn" VARCHAR(200) NOT NULL,
    "titleAr" VARCHAR(200) NOT NULL,
    "bodyEn" VARCHAR(5000) NOT NULL,
    "bodyAr" VARCHAR(5000) NOT NULL,
    "severity" "NotificationSeverity" NOT NULL DEFAULT 'INFO',
    "createdBy" UUID NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementAudience" (
    "id" UUID NOT NULL,
    "announcementId" UUID NOT NULL,
    "type" "AudienceType" NOT NULL,
    "roleKey" "RoleKey",
    "targetId" UUID,
    "sectionId" UUID,

    CONSTRAINT "AnnouncementAudience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemNotification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "titleEn" VARCHAR(200) NOT NULL,
    "titleAr" VARCHAR(200) NOT NULL,
    "bodyEn" VARCHAR(1000) NOT NULL,
    "bodyAr" VARCHAR(1000) NOT NULL,
    "severity" "NotificationSeverity" NOT NULL DEFAULT 'INFO',
    "link" VARCHAR(500),
    "readAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" UUID,
    "actorRole" "RoleKey",
    "action" VARCHAR(120) NOT NULL,
    "entityType" VARCHAR(100),
    "entityId" UUID,
    "requestId" VARCHAR(100),
    "ipAddress" VARCHAR(64),
    "userAgent" VARCHAR(500),
    "beforeData" JSONB,
    "afterData" JSONB,
    "metadata" JSONB,
    "result" "AuditResult" NOT NULL,
    "failureReason" VARCHAR(500),

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportExport" (
    "id" UUID NOT NULL,
    "requestedBy" UUID NOT NULL,
    "reportKey" VARCHAR(100) NOT NULL,
    "format" "ReportFormat" NOT NULL,
    "filters" JSONB NOT NULL,
    "scope" JSONB NOT NULL,
    "rowCount" INTEGER,
    "status" VARCHAR(30) NOT NULL,
    "storageRef" VARCHAR(500),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ReportExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranscriptIssue" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "transcriptNo" VARCHAR(60) NOT NULL,
    "language" VARCHAR(2) NOT NULL,
    "status" "TranscriptStatus" NOT NULL DEFAULT 'VALID',
    "issuedBy" UUID NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" VARCHAR(500),
    "snapshot" JSONB NOT NULL,

    CONSTRAINT "TranscriptIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DegreeProgressSnapshot" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "curriculumId" UUID NOT NULL,
    "completedCredits" INTEGER NOT NULL,
    "requiredCredits" INTEGER NOT NULL,
    "details" JSONB NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DegreeProgressSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_universityId_key" ON "User"("universityId");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_lastNameEn_firstNameEn_idx" ON "User"("lastNameEn", "firstNameEn");

-- CreateIndex
CREATE INDEX "User_lastNameAr_firstNameAr_idx" ON "User"("lastNameAr", "firstNameAr");

-- CreateIndex
CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE INDEX "Permission_resource_action_idx" ON "Permission"("resource", "action");

-- CreateIndex
CREATE INDEX "UserRole_roleId_scopeType_scopeId_idx" ON "UserRole"("roleId", "scopeType", "scopeId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE INDEX "UserSession_userId_revokedAt_idx" ON "UserSession"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_familyId_idx" ON "RefreshToken"("userId", "familyId");

-- CreateIndex
CREATE INDEX "RefreshToken_sessionId_revokedAt_idx" ON "RefreshToken"("sessionId", "revokedAt");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_expiresAt_idx" ON "PasswordResetToken"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_identifier_createdAt_idx" ON "LoginAttempt"("identifier", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_userId_createdAt_idx" ON "LoginAttempt"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_code_key" ON "Faculty"("code");

-- CreateIndex
CREATE INDEX "Faculty_active_idx" ON "Faculty"("active");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE INDEX "Department_facultyId_active_idx" ON "Department"("facultyId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicProgram_code_key" ON "AcademicProgram"("code");

-- CreateIndex
CREATE INDEX "AcademicProgram_departmentId_active_idx" ON "AcademicProgram"("departmentId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_code_key" ON "AcademicYear"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicTerm_code_key" ON "AcademicTerm"("code");

-- CreateIndex
CREATE INDEX "AcademicTerm_academicYearId_status_idx" ON "AcademicTerm"("academicYearId", "status");

-- CreateIndex
CREATE INDEX "AcademicTerm_status_registrationStartsAt_registrationEndsAt_idx" ON "AcademicTerm"("status", "registrationStartsAt", "registrationEndsAt");

-- CreateIndex
CREATE INDEX "Room_active_capacity_idx" ON "Room"("active", "capacity");

-- CreateIndex
CREATE UNIQUE INDEX "Room_buildingCode_roomCode_key" ON "Room"("buildingCode", "roomCode");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "AcademicPolicy_key_active_idx" ON "AcademicPolicy"("key", "active");

-- CreateIndex
CREATE INDEX "AcademicPolicy_termId_active_idx" ON "AcademicPolicy"("termId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicPolicy_key_version_termId_key" ON "AcademicPolicy"("key", "version", "termId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_universityId_key" ON "StudentProfile"("universityId");

-- CreateIndex
CREATE INDEX "StudentProfile_programId_status_idx" ON "StudentProfile"("programId", "status");

-- CreateIndex
CREATE INDEX "StudentProfile_standing_idx" ON "StudentProfile"("standing");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeProfile_userId_key" ON "EmployeeProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeProfile_employeeId_key" ON "EmployeeProfile"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeProfile_departmentId_status_idx" ON "EmployeeProfile"("departmentId", "status");

-- CreateIndex
CREATE INDEX "AdvisorAssignment_advisorId_active_idx" ON "AdvisorAssignment"("advisorId", "active");

-- CreateIndex
CREATE INDEX "AdvisorAssignment_studentId_active_idx" ON "AdvisorAssignment"("studentId", "active");

-- CreateIndex
CREATE INDEX "StudentStatusHistory_studentId_effectiveAt_idx" ON "StudentStatusHistory"("studentId", "effectiveAt");

-- CreateIndex
CREATE INDEX "AcademicStandingHistory_termId_standing_idx" ON "AcademicStandingHistory"("termId", "standing");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicStandingHistory_studentId_termId_key" ON "AcademicStandingHistory"("studentId", "termId");

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");

-- CreateIndex
CREATE INDEX "Course_departmentId_active_idx" ON "Course"("departmentId", "active");

-- CreateIndex
CREATE INDEX "Course_nameEn_idx" ON "Course"("nameEn");

-- CreateIndex
CREATE INDEX "Course_nameAr_idx" ON "Course"("nameAr");

-- CreateIndex
CREATE INDEX "CoursePrerequisite_prerequisiteId_idx" ON "CoursePrerequisite"("prerequisiteId");

-- CreateIndex
CREATE UNIQUE INDEX "CoursePrerequisite_courseId_prerequisiteId_isCorequisite_key" ON "CoursePrerequisite"("courseId", "prerequisiteId", "isCorequisite");

-- CreateIndex
CREATE INDEX "Curriculum_programId_active_idx" ON "Curriculum"("programId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Curriculum_programId_version_key" ON "Curriculum"("programId", "version");

-- CreateIndex
CREATE INDEX "CurriculumCourse_courseId_idx" ON "CurriculumCourse"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumCourse_curriculumId_courseId_key" ON "CurriculumCourse"("curriculumId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseSection_sectionCode_key" ON "CourseSection"("sectionCode");

-- CreateIndex
CREATE INDEX "CourseSection_termId_status_idx" ON "CourseSection"("termId", "status");

-- CreateIndex
CREATE INDEX "CourseSection_courseId_termId_idx" ON "CourseSection"("courseId", "termId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseSection_courseId_termId_sectionNo_key" ON "CourseSection"("courseId", "termId", "sectionNo");

-- CreateIndex
CREATE INDEX "SectionMeeting_roomId_dayOfWeek_startsAt_endsAt_idx" ON "SectionMeeting"("roomId", "dayOfWeek", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "SectionMeeting_sectionId_dayOfWeek_startsAt_key" ON "SectionMeeting"("sectionId", "dayOfWeek", "startsAt");

-- CreateIndex
CREATE INDEX "InstructorSectionAssignment_instructorId_sectionId_idx" ON "InstructorSectionAssignment"("instructorId", "sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "InstructorSectionAssignment_sectionId_instructorId_key" ON "InstructorSectionAssignment"("sectionId", "instructorId");

-- CreateIndex
CREATE INDEX "RegistrationHold_studentId_active_idx" ON "RegistrationHold"("studentId", "active");

-- CreateIndex
CREATE INDEX "RegistrationRequest_termId_status_submittedAt_idx" ON "RegistrationRequest"("termId", "status", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationRequest_studentId_termId_key" ON "RegistrationRequest"("studentId", "termId");

-- CreateIndex
CREATE INDEX "RegistrationItem_sectionId_status_idx" ON "RegistrationItem"("sectionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationItem_requestId_sectionId_key" ON "RegistrationItem"("requestId", "sectionId");

-- CreateIndex
CREATE INDEX "Enrollment_sectionId_status_idx" ON "Enrollment"("sectionId", "status");

-- CreateIndex
CREATE INDEX "Enrollment_studentId_status_idx" ON "Enrollment"("studentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_sectionId_key" ON "Enrollment"("studentId", "sectionId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_sectionId_joinedAt_idx" ON "WaitlistEntry"("sectionId", "joinedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_studentId_sectionId_key" ON "WaitlistEntry"("studentId", "sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_sectionId_position_key" ON "WaitlistEntry"("sectionId", "position");

-- CreateIndex
CREATE INDEX "AddDropRequest_studentId_status_idx" ON "AddDropRequest"("studentId", "status");

-- CreateIndex
CREATE INDEX "ApprovalDecision_registrationRequestId_createdAt_idx" ON "ApprovalDecision"("registrationRequestId", "createdAt");

-- CreateIndex
CREATE INDEX "ApprovalDecision_actorUserId_createdAt_idx" ON "ApprovalDecision"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AttendanceSession_sectionId_sessionDate_idx" ON "AttendanceSession"("sectionId", "sessionDate");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceSession_sectionId_sessionDate_startsAt_key" ON "AttendanceSession"("sectionId", "sessionDate", "startsAt");

-- CreateIndex
CREATE INDEX "AttendanceRecord_studentId_status_idx" ON "AttendanceRecord"("studentId", "status");

-- CreateIndex
CREATE INDEX "AttendanceRecord_enrollmentId_idx" ON "AttendanceRecord"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_sessionId_studentId_key" ON "AttendanceRecord"("sessionId", "studentId");

-- CreateIndex
CREATE INDEX "AttendanceAdjustment_recordId_createdAt_idx" ON "AttendanceAdjustment"("recordId", "createdAt");

-- CreateIndex
CREATE INDEX "Assessment_sectionId_type_idx" ON "Assessment"("sectionId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_sectionId_nameEn_key" ON "Assessment"("sectionId", "nameEn");

-- CreateIndex
CREATE INDEX "AssessmentGrade_enrollmentId_idx" ON "AssessmentGrade"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentGrade_assessmentId_enrollmentId_key" ON "AssessmentGrade"("assessmentId", "enrollmentId");

-- CreateIndex
CREATE INDEX "GradeSubmission_sectionId_status_idx" ON "GradeSubmission"("sectionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FinalGrade_enrollmentId_key" ON "FinalGrade"("enrollmentId");

-- CreateIndex
CREATE INDEX "FinalGrade_status_publishedAt_idx" ON "FinalGrade"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "GradeChangeRequest_finalGradeId_status_idx" ON "GradeChangeRequest"("finalGradeId", "status");

-- CreateIndex
CREATE INDEX "GradeAppeal_studentId_status_idx" ON "GradeAppeal"("studentId", "status");

-- CreateIndex
CREATE INDEX "GradeAppeal_finalGradeId_status_idx" ON "GradeAppeal"("finalGradeId", "status");

-- CreateIndex
CREATE INDEX "Announcement_publishedAt_expiresAt_idx" ON "Announcement"("publishedAt", "expiresAt");

-- CreateIndex
CREATE INDEX "AnnouncementAudience_type_targetId_idx" ON "AnnouncementAudience"("type", "targetId");

-- CreateIndex
CREATE INDEX "AnnouncementAudience_sectionId_idx" ON "AnnouncementAudience"("sectionId");

-- CreateIndex
CREATE INDEX "SystemNotification_userId_readAt_createdAt_idx" ON "SystemNotification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_occurredAt_idx" ON "AuditLog"("actorUserId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_occurredAt_idx" ON "AuditLog"("entityType", "entityId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_occurredAt_idx" ON "AuditLog"("action", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_result_occurredAt_idx" ON "AuditLog"("result", "occurredAt");

-- CreateIndex
CREATE INDEX "ReportExport_requestedBy_createdAt_idx" ON "ReportExport"("requestedBy", "createdAt");

-- CreateIndex
CREATE INDEX "ReportExport_reportKey_createdAt_idx" ON "ReportExport"("reportKey", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TranscriptIssue_transcriptNo_key" ON "TranscriptIssue"("transcriptNo");

-- CreateIndex
CREATE INDEX "TranscriptIssue_studentId_issuedAt_idx" ON "TranscriptIssue"("studentId", "issuedAt");

-- CreateIndex
CREATE INDEX "DegreeProgressSnapshot_studentId_calculatedAt_idx" ON "DegreeProgressSnapshot"("studentId", "calculatedAt");

-- Approved SRS invariants that Prisma cannot express directly.
ALTER TABLE "User"
  ADD CONSTRAINT "User_universityId_format_check"
  CHECK ("universityId" IS NULL OR "universityId" ~ '^[12][0-9]{9}$'),
  ADD CONSTRAINT "User_employeeId_format_check"
  CHECK ("employeeId" IS NULL OR "employeeId" ~ '^E[0-9]{8}$');

ALTER TABLE "StudentProfile"
  ADD CONSTRAINT "StudentProfile_universityId_format_check"
  CHECK ("universityId" ~ '^[12][0-9]{9}$'),
  ADD CONSTRAINT "StudentProfile_gender_prefix_check"
  CHECK ("genderPrefix" IN (1, 2) AND left("universityId", 1)::integer = "genderPrefix"),
  ADD CONSTRAINT "StudentProfile_admission_year_check"
  CHECK (substring("universityId", 2, 4)::integer = "admissionYear"),
  ADD CONSTRAINT "StudentProfile_gpa_check"
  CHECK (("semesterGpa" IS NULL OR "semesterGpa" BETWEEN 0 AND 4) AND ("cumulativeGpa" IS NULL OR "cumulativeGpa" BETWEEN 0 AND 4));

ALTER TABLE "Course"
  ADD CONSTRAINT "Course_credits_positive_check" CHECK ("credits" > 0),
  ADD CONSTRAINT "Course_level_positive_check" CHECK ("level" > 0);

ALTER TABLE "AcademicProgram"
  ADD CONSTRAINT "AcademicProgram_required_credits_positive_check" CHECK ("requiredCredits" > 0);

ALTER TABLE "Room"
  ADD CONSTRAINT "Room_capacity_positive_check" CHECK ("capacity" > 0);

ALTER TABLE "CourseSection"
  ADD CONSTRAINT "CourseSection_capacity_check" CHECK ("capacity" > 0 AND "enrolledCount" >= 0 AND "enrolledCount" <= "capacity");

ALTER TABLE "SectionMeeting"
  ADD CONSTRAINT "SectionMeeting_day_check" CHECK ("dayOfWeek" BETWEEN 0 AND 6),
  ADD CONSTRAINT "SectionMeeting_time_check" CHECK ("startsAt" < "endsAt");

ALTER TABLE "Assessment"
  ADD CONSTRAINT "Assessment_weight_check" CHECK ("weight" > 0 AND "weight" <= 100),
  ADD CONSTRAINT "Assessment_max_score_check" CHECK ("maxScore" > 0);

ALTER TABLE "AssessmentGrade"
  ADD CONSTRAINT "AssessmentGrade_score_nonnegative_check" CHECK ("score" >= 0);

ALTER TABLE "GradingPolicy"
  ADD CONSTRAINT "GradingPolicy_fail_floor_check" CHECK ("failFloor" BETWEEN 0 AND 100);

-- Audit records are append-only, including for database-owner application sessions.
CREATE OR REPLACE FUNCTION sums_prevent_audit_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "AuditLog_prevent_update_delete"
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION sums_prevent_audit_mutation();

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "UserSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginAttempt" ADD CONSTRAINT "LoginAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicProgram" ADD CONSTRAINT "AcademicProgram_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicTerm" ADD CONSTRAINT "AcademicTerm_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicPolicy" ADD CONSTRAINT "AcademicPolicy_termId_fkey" FOREIGN KEY ("termId") REFERENCES "AcademicTerm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_programId_fkey" FOREIGN KEY ("programId") REFERENCES "AcademicProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvisorAssignment" ADD CONSTRAINT "AdvisorAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvisorAssignment" ADD CONSTRAINT "AdvisorAssignment_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "EmployeeProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentStatusHistory" ADD CONSTRAINT "StudentStatusHistory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicStandingHistory" ADD CONSTRAINT "AcademicStandingHistory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicStandingHistory" ADD CONSTRAINT "AcademicStandingHistory_termId_fkey" FOREIGN KEY ("termId") REFERENCES "AcademicTerm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePrerequisite" ADD CONSTRAINT "CoursePrerequisite_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePrerequisite" ADD CONSTRAINT "CoursePrerequisite_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curriculum" ADD CONSTRAINT "Curriculum_programId_fkey" FOREIGN KEY ("programId") REFERENCES "AcademicProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curriculum" ADD CONSTRAINT "Curriculum_effectiveTermId_fkey" FOREIGN KEY ("effectiveTermId") REFERENCES "AcademicTerm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumCourse" ADD CONSTRAINT "CurriculumCourse_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "Curriculum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumCourse" ADD CONSTRAINT "CurriculumCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSection" ADD CONSTRAINT "CourseSection_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSection" ADD CONSTRAINT "CourseSection_termId_fkey" FOREIGN KEY ("termId") REFERENCES "AcademicTerm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionMeeting" ADD CONSTRAINT "SectionMeeting_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionMeeting" ADD CONSTRAINT "SectionMeeting_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorSectionAssignment" ADD CONSTRAINT "InstructorSectionAssignment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorSectionAssignment" ADD CONSTRAINT "InstructorSectionAssignment_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "EmployeeProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationHold" ADD CONSTRAINT "RegistrationHold_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationRequest" ADD CONSTRAINT "RegistrationRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationRequest" ADD CONSTRAINT "RegistrationRequest_termId_fkey" FOREIGN KEY ("termId") REFERENCES "AcademicTerm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationItem" ADD CONSTRAINT "RegistrationItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RegistrationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationItem" ADD CONSTRAINT "RegistrationItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "CourseSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "CourseSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "CourseSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddDropRequest" ADD CONSTRAINT "AddDropRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddDropRequest" ADD CONSTRAINT "AddDropRequest_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalDecision" ADD CONSTRAINT "ApprovalDecision_registrationRequestId_fkey" FOREIGN KEY ("registrationRequestId") REFERENCES "RegistrationRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "CourseSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceAdjustment" ADD CONSTRAINT "AttendanceAdjustment_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "AttendanceRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "CourseSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentGrade" ADD CONSTRAINT "AssessmentGrade_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentGrade" ADD CONSTRAINT "AssessmentGrade_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeSubmission" ADD CONSTRAINT "GradeSubmission_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "CourseSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalGrade" ADD CONSTRAINT "FinalGrade_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeChangeRequest" ADD CONSTRAINT "GradeChangeRequest_finalGradeId_fkey" FOREIGN KEY ("finalGradeId") REFERENCES "FinalGrade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeAppeal" ADD CONSTRAINT "GradeAppeal_finalGradeId_fkey" FOREIGN KEY ("finalGradeId") REFERENCES "FinalGrade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeAppeal" ADD CONSTRAINT "GradeAppeal_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementAudience" ADD CONSTRAINT "AnnouncementAudience_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementAudience" ADD CONSTRAINT "AnnouncementAudience_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "CourseSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemNotification" ADD CONSTRAINT "SystemNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DegreeProgressSnapshot" ADD CONSTRAINT "DegreeProgressSnapshot_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Attendance corrections after the instructor edit window require an explicit decision.
ALTER TABLE "AttendanceAdjustment"
  ADD COLUMN "decision" "ApprovalOutcome",
  ADD COLUMN "decisionReason" VARCHAR(500),
  ADD COLUMN "decidedAt" TIMESTAMP(3);
