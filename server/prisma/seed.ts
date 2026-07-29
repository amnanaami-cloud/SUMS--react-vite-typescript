import { PrismaClient, RoleKey, Prisma, AttendanceStatus, GradeWorkflowStatus } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const roleNames: Record<RoleKey, [string, string]> = {
  student: ['Student', 'طالب'],
  instructor: ['Instructor', 'محاضر'],
  advisor: ['Academic Advisor', 'مرشد أكاديمي'],
  registrar: ['Registration Staff', 'موظف تسجيل'],
  admin: ['System Administrator', 'مدير النظام'],
  depthead: ['Department Head', 'رئيس القسم'],
  coordinator: ['Program Coordinator', 'منسق البرنامج'],
  dean: ['Dean / University Management', 'العميد'],
  uniregistrar: ['University Registrar', 'مسجل الجامعة'],
};

const rolePermissions: Record<RoleKey, string[]> = {
  student: [
    'dashboard.read',
    'profile.read',
    'profile.update',
    'notifications.read',
    'courses.read',
    'registrations.own.read',
    'registrations.own.submit',
    'attendance.read',
    'transcript.read',
    'progress.read',
    'grades.appeal.own',
  ],
  instructor: [
    'dashboard.read',
    'profile.read',
    'profile.update',
    'notifications.read',
    'courses.read',
    'attendance.read',
    'attendance.manage.assigned',
    'grades.manage.assigned',
    'announcements.publish',
    'reports.read',
    'reports.export',
  ],
  advisor: [
    'dashboard.read',
    'profile.read',
    'profile.update',
    'notifications.read',
    'students.read',
    'courses.read',
    'registrations.review',
    'attendance.read',
    'transcript.read',
    'progress.read',
    'reports.read',
    'reports.export',
  ],
  registrar: [
    'dashboard.read',
    'profile.read',
    'profile.update',
    'notifications.read',
    'students.read',
    'students.manage',
    'courses.read',
    'courses.manage',
    'terms.read',
    'terms.manage',
    'sections.manage',
    'registrations.review',
    'registrations.finalize',
    'attendance.read',
    'transcript.read',
    'reports.read',
    'reports.export',
  ],
  admin: [
    'dashboard.read',
    'profile.read',
    'profile.update',
    'notifications.read',
    'users.read',
    'users.manage',
    'roles.manage',
    'audit.read',
    'settings.read',
    'settings.manage',
    'policies.read',
  ],
  depthead: [
    'dashboard.read',
    'notifications.read',
    'students.read',
    'courses.read',
    'courses.manage',
    'terms.read',
    'sections.manage',
    'registrations.review',
    'attendance.read',
    'attendance.approve.department',
    'grades.publish.department',
    'transcript.read',
    'reports.read',
    'reports.export',
    'staff.read',
    'curriculum.read',
    'progress.read',
    'announcements.publish',
    'audit.read',
  ],
  coordinator: [
    'dashboard.read',
    'profile.read',
    'profile.update',
    'notifications.read',
    'students.read',
    'courses.read',
    'curriculum.read',
    'progress.read',
    'reports.read',
    'reports.export',
  ],
  dean: ['dashboard.read', 'notifications.read', 'terms.read', 'reports.read', 'reports.export', 'staff.read'],
  uniregistrar: [
    'dashboard.read',
    'profile.read',
    'profile.update',
    'notifications.read',
    'students.read',
    'students.manage',
    'courses.read',
    'courses.manage',
    'terms.read',
    'terms.manage',
    'sections.manage',
    'registrations.review',
    'registrations.finalize',
    'attendance.read',
    'transcript.read',
    'reports.read',
    'reports.export',
    'curriculum.read',
    'progress.read',
    'audit.read',
    'policies.read',
    'policies.manage',
  ],
};

const demoUsers: Array<{
  role: RoleKey;
  email: string;
  universityId?: string;
  employeeId?: string;
  en: [string, string];
  ar: [string, string];
}> = [
  {
    role: 'student',
    email: 'student@up.edu.ps',
    universityId: '2202100054',
    en: ['Layla', 'Nassar'],
    ar: ['ليلى', 'نصار'],
  },
  {
    role: 'instructor',
    email: 'instructor@up.edu.ps',
    employeeId: 'E20260001',
    en: ['Ahmad', 'Khalil'],
    ar: ['أحمد', 'خليل'],
  },
  { role: 'advisor', email: 'advisor@up.edu.ps', employeeId: 'E20260002', en: ['Mona', 'Saleh'], ar: ['منى', 'صالح'] },
  {
    role: 'registrar',
    email: 'registrar@up.edu.ps',
    employeeId: 'E20260003',
    en: ['Kareem', 'Odeh'],
    ar: ['كريم', 'عودة'],
  },
  { role: 'admin', email: 'admin@up.edu.ps', employeeId: 'E20260004', en: ['System', 'Admin'], ar: ['مدير', 'النظام'] },
  {
    role: 'depthead',
    email: 'depthead@up.edu.ps',
    employeeId: 'E20260005',
    en: ['Huda', 'Nassar'],
    ar: ['هدى', 'نصار'],
  },
  {
    role: 'coordinator',
    email: 'coordinator@up.edu.ps',
    employeeId: 'E20260006',
    en: ['Rana', 'Ali'],
    ar: ['رنا', 'علي'],
  },
  {
    role: 'dean',
    email: 'dean@up.edu.ps',
    employeeId: 'E20260007',
    en: ['Sami', 'Barghouti'],
    ar: ['سامي', 'البرغوثي'],
  },
  {
    role: 'uniregistrar',
    email: 'uniregistrar@up.edu.ps',
    employeeId: 'E20260008',
    en: ['Tariq', 'Mansour'],
    ar: ['طارق', 'منصور'],
  },
];

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Demo seeding is disabled in production');
  const demoPassword = process.env.SEED_DEMO_PASSWORD || 'SumsDemo!2026';
  if (!process.env.SEED_DEMO_PASSWORD)
    process.stderr.write(
      'WARNING: using the documented development-only seed password. Never use it outside local development.\n',
    );
  const passwordHash = await argon2.hash(demoPassword, { type: argon2.argon2id });

  const permissionKeys = [...new Set(Object.values(rolePermissions).flat())];
  const permissions = new Map<string, { id: string }>();
  for (const key of permissionKeys) {
    const [resource, ...action] = key.split('.');
    const permission = await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, resource, action: action.join('.') || 'read', description: `Development permission: ${key}` },
    });
    permissions.set(key, permission);
  }
  const roles = new Map<RoleKey, { id: string }>();
  for (const key of Object.values(RoleKey)) {
    const [nameEn, nameAr] = roleNames[key];
    const role = await prisma.role.upsert({
      where: { key },
      update: { nameEn, nameAr },
      create: { key, nameEn, nameAr, description: `Approved SUMS role ${key}` },
    });
    roles.set(key, role);
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: rolePermissions[key].map((permissionKey) => ({
        roleId: role.id,
        permissionId: permissions.get(permissionKey)!.id,
      })),
      skipDuplicates: true,
    });
  }

  const faculty = await prisma.faculty.upsert({
    where: { code: 'EIT' },
    update: {},
    create: {
      code: 'EIT',
      nameEn: 'Faculty of Engineering and Information Technology',
      nameAr: 'كلية الهندسة وتكنولوجيا المعلومات',
    },
  });
  const department = await prisma.department.upsert({
    where: { code: 'CS' },
    update: {},
    create: { facultyId: faculty.id, code: 'CS', nameEn: 'Computer Science Department', nameAr: 'قسم علوم الحاسوب' },
  });
  const program = await prisma.academicProgram.upsert({
    where: { code: 'BCS' },
    update: {},
    create: {
      departmentId: department.id,
      code: 'BCS',
      nameEn: 'Computer Science',
      nameAr: 'علوم الحاسوب',
      degreeNameEn: 'Bachelor of Computer Science',
      degreeNameAr: 'بكالوريوس علوم الحاسوب',
      requiredCredits: 132,
    },
  });
  const year = await prisma.academicYear.upsert({
    where: { code: '2026-2027' },
    update: {},
    create: { code: '2026-2027', startsOn: new Date('2026-09-01'), endsOn: new Date('2027-08-31'), active: true },
  });
  const term = await prisma.academicTerm.upsert({
    where: { code: '2026-1' },
    update: {},
    create: {
      academicYearId: year.id,
      code: '2026-1',
      type: 'FIRST',
      nameEn: 'First Semester 2026/2027',
      nameAr: 'الفصل الأول 2026/2027',
      status: 'REGISTRATION_OPEN',
      startsOn: new Date('2026-09-01'),
      endsOn: new Date('2027-01-15'),
      registrationStartsAt: new Date('2026-07-01T00:00:00+03:00'),
      registrationEndsAt: new Date('2026-08-20T23:59:59+03:00'),
      addDropEndsAt: new Date('2026-09-08T23:59:59+03:00'),
      withdrawalEndsAt: new Date('2026-11-30T23:59:59+03:00'),
      appealEndsAt: new Date('2027-01-25T23:59:59+03:00'),
      gradeSubmissionEndsAt: new Date('2027-01-20T23:59:59+03:00'),
    },
  });
  const priorYear = await prisma.academicYear.upsert({
    where: { code: '2025-2026' },
    update: {},
    create: { code: '2025-2026', startsOn: new Date('2025-09-01'), endsOn: new Date('2026-08-31') },
  });
  const priorTerm = await prisma.academicTerm.upsert({
    where: { code: '2025-1' },
    update: {},
    create: {
      academicYearId: priorYear.id,
      code: '2025-1',
      type: 'FIRST',
      nameEn: 'First Semester 2025/2026',
      nameAr: 'الفصل الأول 2025/2026',
      status: 'CLOSED',
      startsOn: new Date('2025-09-01'),
      endsOn: new Date('2026-01-15'),
      registrationStartsAt: new Date('2025-07-01'),
      registrationEndsAt: new Date('2025-08-20'),
      addDropEndsAt: new Date('2025-09-08'),
      withdrawalEndsAt: new Date('2025-11-30'),
      closedAt: new Date('2026-01-25'),
    },
  });

  const userIds = new Map<RoleKey, string>();
  for (const demo of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: demo.email },
      update: { passwordHash, status: 'ACTIVE' },
      create: {
        email: demo.email,
        universityId: demo.universityId,
        employeeId: demo.employeeId,
        passwordHash,
        firstNameEn: demo.en[0],
        lastNameEn: demo.en[1],
        firstNameAr: demo.ar[0],
        lastNameAr: demo.ar[1],
      },
    });
    userIds.set(demo.role, user.id);
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: roles.get(demo.role)!.id } },
      update: {},
      create: {
        userId: user.id,
        roleId: roles.get(demo.role)!.id,
        reason: 'DEVELOPMENT_SEED',
        scopeType:
          demo.role === 'coordinator'
            ? 'PROGRAM'
            : demo.role === 'dean'
              ? 'FACULTY'
              : demo.role === 'depthead'
                ? 'DEPARTMENT'
                : undefined,
        scopeId:
          demo.role === 'coordinator'
            ? program.id
            : demo.role === 'dean'
              ? faculty.id
              : demo.role === 'depthead'
                ? department.id
                : undefined,
      },
    });
    if (demo.role !== 'student')
      await prisma.employeeProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          departmentId:
            demo.role === 'admin' || demo.role === 'dean' || demo.role === 'uniregistrar' ? undefined : department.id,
          employeeId: demo.employeeId!,
          titleEn: roleNames[demo.role][0],
          titleAr: roleNames[demo.role][1],
        },
      });
  }
  const student = await prisma.studentProfile.upsert({
    where: { universityId: '2202100054' },
    update: {},
    create: {
      userId: userIds.get('student')!,
      programId: program.id,
      universityId: '2202100054',
      genderPrefix: 2,
      admissionYear: 2021,
      admissionDate: new Date('2021-09-01'),
      currentLevel: 3,
      status: 'ACTIVE',
      earnedCredits: 48,
      semesterGpa: new Prisma.Decimal('3.74'),
      cumulativeGpa: new Prisma.Decimal('3.62'),
      standing: 'GOOD_STANDING',
    },
  });
  const advisor = await prisma.employeeProfile.findUniqueOrThrow({ where: { userId: userIds.get('advisor')! } });
  const instructor = await prisma.employeeProfile.findUniqueOrThrow({ where: { userId: userIds.get('instructor')! } });
  await prisma.advisorAssignment.createMany({
    data: [{ studentId: student.id, advisorId: advisor.id, startsOn: new Date('2025-09-01'), active: true }],
    skipDuplicates: true,
  });

  const extraStudents = [
    ['1202200019', 'Omar', 'Haddad', 'عمر', 'حداد', '3.10'],
    ['2202200044', 'Sara', 'Mansour', 'سارة', 'منصور', '3.44'],
    ['1202100088', 'Yousef', 'Ali', 'يوسف', 'علي', '1.47'],
    ['2202200101', 'Nour', 'Khalil', 'نور', 'خليل', '3.88'],
    ['1202100133', 'Rami', 'Saleh', 'رامي', 'صالح', '3.12'],
  ];
  for (const [universityId, firstNameEn, lastNameEn, firstNameAr, lastNameAr, gpa] of extraStudents) {
    const email = `${firstNameEn.toLowerCase()}.${lastNameEn.toLowerCase()}@up.edu.ps`;
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash },
      create: { email, universityId, passwordHash, firstNameEn, lastNameEn, firstNameAr, lastNameAr },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: roles.get('student')!.id } },
      update: {},
      create: { userId: user.id, roleId: roles.get('student')!.id, reason: 'DEVELOPMENT_SEED' },
    });
    const profile = await prisma.studentProfile.upsert({
      where: { universityId },
      update: {},
      create: {
        userId: user.id,
        programId: program.id,
        universityId,
        genderPrefix: Number(universityId[0]),
        admissionYear: Number(universityId.slice(1, 5)),
        admissionDate: new Date(`${universityId.slice(1, 5)}-09-01`),
        currentLevel: 2,
        cumulativeGpa: new Prisma.Decimal(gpa),
        standing: Number(gpa) < 1.5 ? 'PROBATION' : 'GOOD_STANDING',
      },
    });
    await prisma.advisorAssignment.createMany({
      data: [{ studentId: profile.id, advisorId: advisor.id, startsOn: new Date('2025-09-01'), active: true }],
      skipDuplicates: true,
    });
  }

  const rooms = [];
  for (const [buildingCode, roomCode, capacity, isLaboratory] of [
    ['B', '204', 40, false],
    ['A', '110', 35, false],
    ['B', '201', 30, true],
    ['C', '305', 50, false],
    ['D', '102', 45, false],
  ] as const) {
    rooms.push(
      await prisma.room.upsert({
        where: { buildingCode_roomCode: { buildingCode, roomCode } },
        update: {},
        create: { buildingCode, roomCode, capacity, isLaboratory },
      }),
    );
  }
  const courseDefs = [
    ['CS201', 'Programming II', 'برمجة 2', 3, 2, 'THEORY'],
    ['CS301', 'Data Structures', 'هياكل البيانات', 3, 3, 'THEORY'],
    ['CS340', 'Operating Systems', 'نظم التشغيل', 3, 3, 'THEORY'],
    ['CS355', 'Database Systems', 'نظم قواعد البيانات', 3, 3, 'MIXED'],
    ['MATH210', 'Linear Algebra', 'الجبر الخطي', 3, 2, 'THEORY'],
    ['ENG201', 'Technical Writing', 'الكتابة التقنية', 3, 2, 'THEORY'],
  ] as const;
  const courses = new Map<string, { id: string; code: string }>();
  for (const [code, nameEn, nameAr, credits, level, type] of courseDefs)
    courses.set(
      code,
      await prisma.course.upsert({
        where: { code },
        update: {},
        create: { departmentId: department.id, code, nameEn, nameAr, credits, level, type },
      }),
    );
  await prisma.coursePrerequisite.createMany({
    data: [
      { courseId: courses.get('CS301')!.id, prerequisiteId: courses.get('CS201')!.id, minimumGrade: 'C' },
      { courseId: courses.get('CS340')!.id, prerequisiteId: courses.get('CS301')!.id, minimumGrade: 'C' },
      { courseId: courses.get('CS355')!.id, prerequisiteId: courses.get('CS301')!.id, minimumGrade: 'C' },
    ],
    skipDuplicates: true,
  });
  const curriculum = await prisma.curriculum.upsert({
    where: { programId_version: { programId: program.id, version: 1 } },
    update: {},
    create: {
      programId: program.id,
      effectiveTermId: priorTerm.id,
      version: 1,
      nameEn: 'BCS Study Plan 2025',
      nameAr: 'الخطة الدراسية 2025',
      totalCredits: 132,
      active: true,
      approvedAt: new Date('2025-06-01'),
      approvedBy: userIds.get('uniregistrar'),
    },
  });
  await prisma.curriculumCourse.createMany({
    data: [...courses.values()].map((course, index) => ({
      curriculumId: curriculum.id,
      courseId: course.id,
      category: course.code.startsWith('CS') ? 'Core Requirements' : 'University Requirements',
      recommendedLevel: index < 2 ? 2 : 3,
      required: true,
    })),
    skipDuplicates: true,
  });

  const sectionDefs = [
    ['CS301', '01', 35, 0, '09:00:00', '10:30:00'],
    ['CS340', '01', 28, 1, '11:00:00', '12:30:00'],
    ['CS355', '01', 30, 0, '12:30:00', '14:00:00'],
    ['MATH210', '01', 40, 1, '09:00:00', '10:30:00'],
    ['ENG201', '01', 40, 4, '10:00:00', '12:00:00'],
  ] as const;
  const sections = new Map<string, { id: string }>();
  for (let index = 0; index < sectionDefs.length; index += 1) {
    const [code, sectionNo, capacity, dayOfWeek, startsAt, endsAt] = sectionDefs[index];
    const course = courses.get(code)!;
    const sectionCode = `${code}-${term.code}-${sectionNo}`;
    const section = await prisma.courseSection.upsert({
      where: { sectionCode },
      update: {},
      create: {
        courseId: course.id,
        termId: term.id,
        sectionNo,
        sectionCode,
        capacity,
        status: 'OPEN',
        gradingModel: code === 'CS301' ? 'ABSOLUTE' : 'RELATIVE',
      },
    });
    sections.set(code, section);
    await prisma.sectionMeeting.upsert({
      where: {
        sectionId_dayOfWeek_startsAt: {
          sectionId: section.id,
          dayOfWeek,
          startsAt: new Date(`1970-01-01T${startsAt}Z`),
        },
      },
      update: {},
      create: {
        sectionId: section.id,
        roomId: rooms[index].id,
        dayOfWeek,
        startsAt: new Date(`1970-01-01T${startsAt}Z`),
        endsAt: new Date(`1970-01-01T${endsAt}Z`),
        isLab: code === 'CS355',
      },
    });
    await prisma.instructorSectionAssignment.upsert({
      where: { sectionId_instructorId: { sectionId: section.id, instructorId: instructor.id } },
      update: {},
      create: {
        sectionId: section.id,
        instructorId: instructor.id,
        role: 'PRIMARY',
        assignedBy: userIds.get('depthead'),
      },
    });
  }

  // Completed prerequisite and current authoritative enrollments.
  const priorSection = await prisma.courseSection.upsert({
    where: { sectionCode: `CS201-${priorTerm.code}-01` },
    update: {},
    create: {
      courseId: courses.get('CS201')!.id,
      termId: priorTerm.id,
      sectionNo: '01',
      sectionCode: `CS201-${priorTerm.code}-01`,
      capacity: 35,
      enrolledCount: 1,
      status: 'COMPLETED',
    },
  });
  const priorEnrollment = await prisma.enrollment.upsert({
    where: { studentId_sectionId: { studentId: student.id, sectionId: priorSection.id } },
    update: {},
    create: { studentId: student.id, sectionId: priorSection.id, status: 'COMPLETED' },
  });
  await prisma.finalGrade.upsert({
    where: { enrollmentId: priorEnrollment.id },
    update: {},
    create: {
      enrollmentId: priorEnrollment.id,
      rawScore: new Prisma.Decimal('88.00'),
      resultCode: 'LETTER',
      letterGrade: 'A-',
      gradePoints: new Prisma.Decimal('3.70'),
      status: 'PUBLISHED',
      effectiveForGpa: true,
      publishedAt: new Date('2026-01-20'),
    },
  });
  for (const code of ['CS301', 'MATH210', 'ENG201']) {
    const section = sections.get(code)!;
    const enrollment = await prisma.enrollment.upsert({
      where: { studentId_sectionId: { studentId: student.id, sectionId: section.id } },
      update: {},
      create: { studentId: student.id, sectionId: section.id, status: 'REGISTERED' },
    });
    await prisma.courseSection.update({ where: { id: section.id }, data: { enrolledCount: 1 } });
    if (code === 'CS301') {
      const session = await prisma.attendanceSession.upsert({
        where: {
          sectionId_sessionDate_startsAt: {
            sectionId: section.id,
            sessionDate: new Date('2026-07-24'),
            startsAt: new Date('1970-01-01T09:00:00Z'),
          },
        },
        update: {},
        create: {
          sectionId: section.id,
          sessionDate: new Date('2026-07-24'),
          startsAt: new Date('1970-01-01T09:00:00Z'),
          status: 'SUBMITTED',
          createdBy: userIds.get('instructor')!,
          submittedAt: new Date('2026-07-24T10:30:00+03:00'),
        },
      });
      await prisma.attendanceRecord.upsert({
        where: { sessionId_studentId: { sessionId: session.id, studentId: student.id } },
        update: {},
        create: {
          sessionId: session.id,
          studentId: student.id,
          enrollmentId: enrollment.id,
          status: AttendanceStatus.PRESENT,
          markedBy: userIds.get('instructor')!,
        },
      });
      const assessment = await prisma.assessment.upsert({
        where: { sectionId_nameEn: { sectionId: section.id, nameEn: 'Coursework' } },
        update: {},
        create: {
          sectionId: section.id,
          nameEn: 'Coursework',
          nameAr: 'أعمال الفصل',
          type: 'COURSEWORK',
          weight: new Prisma.Decimal(20),
          maxScore: new Prisma.Decimal(100),
          createdBy: userIds.get('instructor')!,
        },
      });
      await prisma.assessmentGrade.upsert({
        where: { assessmentId_enrollmentId: { assessmentId: assessment.id, enrollmentId: enrollment.id } },
        update: {},
        create: {
          assessmentId: assessment.id,
          enrollmentId: enrollment.id,
          score: new Prisma.Decimal(88),
          enteredBy: userIds.get('instructor')!,
        },
      });
    }
  }

  const request = await prisma.registrationRequest.upsert({
    where: { studentId_termId: { studentId: student.id, termId: term.id } },
    update: {},
    create: {
      studentId: student.id,
      termId: term.id,
      status: 'FINALIZED',
      totalCredits: 9,
      submittedAt: new Date('2026-07-20'),
      finalizedAt: new Date('2026-07-21'),
    },
  });
  await prisma.registrationItem.createMany({
    data: ['CS301', 'MATH210', 'ENG201'].map((code) => ({
      requestId: request.id,
      sectionId: sections.get(code)!.id,
      status: 'REGISTERED',
    })),
    skipDuplicates: true,
  });
  await prisma.approvalDecision.createMany({
    data: [
      {
        registrationRequestId: request.id,
        actorUserId: userIds.get('advisor')!,
        actorRole: 'advisor',
        outcome: 'APPROVED',
        reason: 'Development seed approval',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.gradingPolicy.createMany({
    data: [
      {
        nameEn: 'Approved Absolute Grading',
        nameAr: 'التقييم المطلق المعتمد',
        model: 'ABSOLUTE',
        thresholds: { A: 90, 'A-': 85, 'B+': 80, B: 75, 'B-': 70, 'C+': 65, C: 60, 'C-': 55, 'D+': 50, D: 45, F: 0 },
        failFloor: new Prisma.Decimal(45),
        sourceRef: 'BR-40',
      },
      {
        nameEn: 'Approved Relative Grading',
        nameAr: 'التقييم النسبي المعتمد',
        model: 'RELATIVE',
        thresholds: { A: 65, 'A-': 60, 'B+': 55, B: 50, 'B-': 45, 'C+': 40, C: 35, 'C-': 30, 'D+': 25, D: 20, F: 0 },
        failFloor: new Prisma.Decimal(45),
        minPopulation: 10,
        sourceRef: 'BR-38-BR-41',
      },
    ],
    skipDuplicates: true,
  });
  const policies = [
    [
      'registration.regular_load',
      { minimum: 18, standardMaximum: 18, highGpaMaximum: 21, highGpaThreshold: 3, warningProbationMaximum: 12 },
      'BR-20',
    ],
    ['registration.summer_load', { maximum: 9, probationMaximum: 6 }, 'BR-21'],
    ['registration.prerequisite', { minimumGrade: 'C', overridesAllowed: false }, 'BR-17'],
    ['registration.repeat', { maxAttempts: 3, blockParallelAttempts: true }, 'BR-27'],
    ['attendance.general', { thresholdPercent: 75, latePerAbsence: 3, instructorEditDays: 7 }, 'BR-29-BR-35'],
    ['security.password_session', { minimumLength: 8, failureLimit: 3, lockMinutes: 15, idleMinutes: 30 }, 'BR-62'],
    ['grading.gpa', { scale: 4, decimals: 2, mode: 'TRUNCATE' }, 'BR-43-BR-44'],
  ] as const;
  for (const [key, value, sourceRef] of policies)
    await prisma.academicPolicy.upsert({
      where: { key_version_termId: { key, version: 1, termId: term.id } },
      update: {},
      create: {
        key,
        version: 1,
        termId: term.id,
        value,
        sourceRef,
        effectiveFrom: new Date('2026-07-01'),
        active: true,
        createdBy: userIds.get('uniregistrar'),
      },
    });
  for (const [key, value, description] of [
    [
      'institution.display',
      { nameEn: 'University of Palestine', nameAr: 'جامعة فلسطين' },
      'Configurable demonstration institution display',
    ],
    [
      'localization',
      { defaultLanguage: 'ar', supported: ['ar', 'en'], timezone: 'Asia/Gaza' },
      'Approved bilingual and Palestine-time settings',
    ],
    ['maintenance', { enabled: false, messageEn: '', messageAr: '' }, 'Maintenance state'],
  ] as const)
    await prisma.systemSetting.upsert({
      where: { key },
      update: {},
      create: { key, value, description, updatedBy: userIds.get('admin') },
    });
  const announcement = await prisma.announcement.create({
    data: {
      titleEn: 'Registration is open',
      titleAr: 'التسجيل مفتوح',
      bodyEn: 'First-semester registration is now available.',
      bodyAr: 'التسجيل للفصل الأول متاح الآن.',
      severity: 'INFO',
      createdBy: userIds.get('registrar')!,
      publishedAt: new Date(),
      audiences: { create: { type: 'ALL' } },
    },
  });
  await prisma.auditLog.createMany({
    data: [
      {
        actorUserId: userIds.get('registrar'),
        actorRole: 'registrar',
        action: 'DEVELOPMENT_SEED_CREATED',
        entityType: 'AcademicTerm',
        entityId: term.id,
        result: 'SUCCESS',
        metadata: { source: 'fictional development data' },
      },
      {
        actorUserId: userIds.get('instructor'),
        actorRole: 'instructor',
        action: 'ANNOUNCEMENT_PUBLISHED',
        entityType: 'Announcement',
        entityId: announcement.id,
        result: 'SUCCESS',
        metadata: { source: 'fictional development data' },
      },
    ],
    skipDuplicates: true,
  });
}

main().finally(async () => prisma.$disconnect());
