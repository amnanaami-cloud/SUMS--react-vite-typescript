import { Icon } from '../icons';
import { useStore } from '../store';
import { NAMES, AVATAR, ADVISEES } from '../data';
import { StatGrid, useStatCards, SectionTitle, Bar } from '../components/ui';

export function Profile() {
  const { s, L, ar, cn, toast } = useStore();
  const nm = NAMES[s.role];
  const fields: [string, string][] = [
    [cn('Full Name', 'الاسم الكامل'), nm[ar ? 1 : 0]],
    [cn('National ID', 'رقم الهوية'), '405512309'],
    [cn('User ID', 'معرّف المستخدم'), '2021054'],
    [cn('Email', 'البريد'), (s.role === 'student' ? 'layla.nassar' : s.role) + '@up.edu.ps'],
    [cn('Phone', 'الهاتف'), '+970 599 123 456'],
    [cn('Role', 'الدور'), L['r_' + s.role]],
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' }}>
      <div className="card card-pad" style={{ textAlign: 'center' }}>
        <div className="avatar" style={{ width: 96, height: 96, fontSize: 34, background: AVATAR[s.role], margin: '0 auto 14px' }}>{nm[2]}</div>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 19 }}>{nm[ar ? 1 : 0]}</div>
        <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{L['r_' + s.role]}</div>
        <button className="btn-tint" style={{ width: '100%', marginTop: 18 }}>{L.editProfile}</button>
        <button className="btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => toast(cn('Change password dialog', 'مربع تغيير كلمة المرور'))}>{L.changePwd}</button>
      </div>
      <div className="card card-pad">
        <SectionTitle>{L.personalInfo}</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {fields.map((f, i) => (
            <div key={i}><div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 5 }}>{f[0]}</div><div style={{ fontSize: 14, fontWeight: 600, padding: '10px 12px', background: '#F8F9FA', borderRadius: 9 }}>{f[1]}</div></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WeeklySchedule() {
  const { L, cn } = useStore();
  const days: [string, [string, string, string, string][]][] = [
    [cn('Sun', 'الأحد'), [['09:00', 'CS301', 'B-204', '#13737A']]],
    [cn('Mon', 'الإثنين'), [['09:00', 'MATH210', 'C-305', '#3B82F6'], ['11:00', 'CS340', 'A-110', '#D4AF37']]],
    [cn('Tue', 'الثلاثاء'), [['09:00', 'CS301', 'B-204', '#13737A'], ['12:30', 'CS355', 'B-201', '#10B981']]],
    [cn('Wed', 'الأربعاء'), [['11:00', 'CS340', 'A-110', '#D4AF37']]],
    [cn('Thu', 'الخميس'), [['10:00', 'CS410', 'B-210', '#8B5CF6']]],
  ];
  return (
    <div className="card card-pad">
      <SectionTitle>{L.weeklySchedule} · {cn('Fall 2026', 'خريف ٢٠٢٦')}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
        {days.map((d, i) => (
          <div key={i}>
            <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 13, color: '#374151', paddingBottom: 10, borderBottom: '2px solid #F1F3F4', marginBottom: 10 }}>{d[0]}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 60 }}>
              {d[1].map((sx, j) => (
                <div key={j} style={{ background: sx[3] + '14', borderInlineStart: '3px solid ' + sx[3], borderRadius: 8, padding: '9px 11px' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: sx[3] }}>{sx[1]}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 3 }}>{sx[0]} · {sx[2]}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Reports() {
  const { L, cn, toast } = useStore();
  const cards: [string, string, string][] = [
    ['chart', cn('Enrollment Report', 'تقرير التسجيل'), cn('Students per course, section & term', 'الطلاب حسب المادة والشعبة والفصل')],
    ['graduation', cn('Academic Standing', 'تقرير الوضع الأكاديمي'), cn('GPA distribution & probation list', 'توزيع المعدلات وقائمة الإنذار')],
    ['edit', cn('Registration Summary', 'ملخص التسجيل'), cn('Submitted, approved & finalized counts', 'أعداد المُرسل والمعتمد والمنجز')],
    ['lock', cn('Holds Report', 'تقرير القيود'), cn('Financial, academic & admin holds', 'قيود مالية وأكاديمية وإدارية')],
    ['check', cn('Graduation Readiness', 'جاهزية التخرج'), cn('Students within 30 credits of degree', 'الطلاب على بُعد ٣٠ ساعة من التخرج')],
    ['users', cn('Advisee Progress', 'تقدم الطلاب'), cn('Per-advisee completion tracking', 'متابعة إنجاز كل طالب')],
  ];
  const ex = () => toast(cn('Report exported', 'تم تصدير التقرير'));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
      {cards.map((c, i) => (
        <div key={i} className="card card-pad">
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#E1F0F1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#13737A', marginBottom: 14 }}><Icon name={c[0]} size={22} /></div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{c[1]}</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 6, lineHeight: 1.5, minHeight: 38 }}>{c[2]}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="btn-teal" style={{ flex: 1 }} onClick={ex}>PDF</button>
            <button className="btn-tint" style={{ flex: 1 }} onClick={ex}>Excel</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function GenericDashboard() {
  const { L, cn } = useStore();
  const stats = useStatCards();
  const dates: [string, string, string][] = [
    [cn('Add/Drop deadline', 'آخر موعد للإضافة/الحذف'), cn('August 5, 2026', '٥ آب ٢٠٢٦'), '#EF4444'],
    [cn('Registration opens', 'فتح التسجيل'), cn('July 28, 2026', '٢٨ تموز ٢٠٢٦'), '#10B981'],
    [cn('Term starts', 'بداية الفصل'), cn('September 1, 2026', '١ أيلول ٢٠٢٦'), '#3B82F6'],
    [cn('Fee payment deadline', 'آخر موعد لدفع الرسوم'), cn('August 20, 2026', '٢٠ آب ٢٠٢٦'), '#F59E0B'],
  ];
  const ann: [string, string, string, string][] = [
    [cn('Jul 22', '٢٢ تموز'), '#EF4444', cn('Curriculum review meeting', 'اجتماع مراجعة الخطة'), cn('Program committee, Sunday 10:00.', 'لجنة البرنامج، الأحد ١٠:٠٠.')],
    [cn('Jul 20', '٢٠ تموز'), '#13737A', cn('New elective approved', 'اعتماد مادة اختيارية'), cn('CS460 added to the plan.', 'أُضيفت CS460 للخطة.')],
  ];
  return (
    <>
      <StatGrid items={stats} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card card-pad">
          <SectionTitle>{L.importantDates}</SectionTitle>
          {dates.map((d, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '11px 0', borderBottom: '1px solid #F1F3F4' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: d[2], marginTop: 6 }} />
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{d[0]}</div><div style={{ fontSize: 12, color: '#6B7280' }}>{d[1]}</div></div>
            </div>
          ))}
        </div>
        <div className="card card-pad">
          <SectionTitle>{L.announcements2}</SectionTitle>
          {ann.map((a, i) => (
            <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid #F1F3F4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: a[1] }} /><span style={{ fontSize: 11, color: '#9CA3AF' }}>{a[0]}</span></div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{a[2]}</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2, lineHeight: 1.5 }}>{a[3]}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function StudentsTable({ withActions }: { withActions: boolean }) {
  const { L, ar, cn } = useStore();
  return (
    <div className="tbl-wrap">
      <div style={{ padding: '14px 22px', borderBottom: '1px solid #F1F3F4', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ color: '#9CA3AF' }}><Icon name="search" size={18} /></span>
        <input placeholder={L.searchStudents} style={{ flex: 1, minWidth: 160, border: 'none', outline: 'none', fontSize: 14 }} />
        {withActions && <button className="btn-teal" style={{ padding: '8px 16px' }}>{L.addStudent}</button>}
      </div>
      <table>
        <thead><tr><th style={{ paddingInlineStart: 22 }}>{L.thName}</th><th>ID</th><th>{L.thMajor}</th><th style={{ textAlign: 'center' }}>{L.yearLabel}</th><th style={{ textAlign: 'center' }}>GPA</th><th style={{ textAlign: 'center' }}>{L.thStatus}</th>{withActions && <th />}</tr></thead>
        <tbody>
          {ADVISEES.map((a) => {
            const yr = ar ? ['', '١', '٢', '٣', '٤'][a[5]] : a[5];
            const c = a[7] === 'Probation' ? '#EF4444' : '#10B981';
            return (
              <tr key={a[2]}>
                <td style={{ paddingInlineStart: 22 }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div className="avatar" style={{ width: 32, height: 32, fontSize: 12, background: '#DBEAFE', color: '#1E40AF' }}>{(ar ? a[1] : a[0]).slice(0, 1)}</div>{cn(a[0], a[1])}</div></td>
                <td style={{ color: '#6B7280' }}>{a[2]}</td>
                <td>{cn(a[3], a[4])}</td>
                <td style={{ textAlign: 'center' }}>{yr}</td>
                <td style={{ textAlign: 'center', fontWeight: 700, color: '#13737A' }}>{(a[6] as number).toFixed(2)}</td>
                <td style={{ textAlign: 'center' }}><span className="badge" style={{ background: c + '1a', color: c }}>{cn(a[7], a[8])}</span></td>
                {withActions && <td style={{ textAlign: 'center', paddingInlineEnd: 22 }}><a href="#" onClick={(e) => e.preventDefault()}>{L.thTranscript}</a></td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function Curriculum() {
  const { L, cn } = useStore();
  const c: [string, number, number][] = [
    [cn('Core Requirements', 'متطلبات التخصص'), 60, 48], [cn('Mathematics', 'الرياضيات'), 18, 18], [cn('University Requirements', 'متطلبات الجامعة'), 30, 21], [cn('Electives', 'مواد اختيارية'), 24, 9],
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 760 }}>
      {c.map((x, i) => {
        const pct = Math.round(x[2] / x[1] * 100);
        return (
          <div key={i} className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{x[0]}</div>
              <div style={{ fontSize: 13, color: '#6B7280' }}>{x[2]} / {x[1]} {L.creditsLabel} · {pct}%</div>
            </div>
            <div className="bar" style={{ height: 9 }}><span style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#13737A,#D4AF37)' }} /></div>
          </div>
        );
      })}
    </div>
  );
}

export function ProgramProgress() {
  const { L, cn } = useStore();
  const pcts = [72, 48, 60, 35, 25, 88];
  return (
    <div className="card card-pad">
      <SectionTitle>{L.degreePlan} · {L.completionL}</SectionTitle>
      {ADVISEES.map((a, i) => {
        const p = pcts[i]; const c = p >= 60 ? '#10B981' : p >= 40 ? '#F59E0B' : '#EF4444';
        return (
          <div key={a[2]} style={{ padding: '13px 0', borderBottom: '1px solid #F1F3F4' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 7 }}><span style={{ fontWeight: 600 }}>{cn(a[0], a[1])} · {a[2]}</span><span style={{ fontWeight: 700, color: c }}>{p}%</span></div>
            <Bar pct={p} color={c} h={8} />
          </div>
        );
      })}
    </div>
  );
}

export function Terms() {
  const { L, cn } = useStore();
  const terms: [string, string, string, string, string, string, number, string][] = [
    ['Fall 2026', 'خريف ٢٠٢٦', 'Sep 1, 2026', 'Jan 15, 2027', 'Active', 'نشط', 312, '8,420'],
    ['Summer 2026', 'صيف ٢٠٢٦', 'Jun 1, 2026', 'Aug 20, 2026', 'Active', 'نشط', 96, '2,140'],
    ['Spring 2026', 'ربيع ٢٠٢٦', 'Feb 1, 2026', 'Jun 1, 2026', 'Closed', 'مغلق', 298, '8,010'],
  ];
  return (
    <div className="tbl-wrap">
      <div style={{ padding: '14px 22px', borderBottom: '1px solid #F1F3F4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{L.m_terms}</div>
        <button className="btn-teal" style={{ padding: '8px 16px' }}>+ {L.generate}</button>
      </div>
      <table>
        <thead><tr><th style={{ paddingInlineStart: 22 }}>{L.semesterLabel}</th><th>{L.currentL}→{L.targetL}</th><th style={{ textAlign: 'center' }}>{L.m_courses}</th><th style={{ textAlign: 'center' }}>{L.m_students}</th><th style={{ textAlign: 'center', paddingInlineEnd: 22 }}>{L.thStatus}</th></tr></thead>
        <tbody>
          {terms.map((t, i) => {
            const c = t[4] === 'Active' ? '#10B981' : '#9CA3AF';
            return (
              <tr key={i}>
                <td style={{ paddingInlineStart: 22, fontWeight: 600 }}>{cn(t[0], t[1])}</td>
                <td style={{ color: '#6B7280' }}>{t[2]} — {t[3]}</td>
                <td style={{ textAlign: 'center' }}>{t[6]}</td>
                <td style={{ textAlign: 'center' }}>{t[7]}</td>
                <td style={{ textAlign: 'center', paddingInlineEnd: 22 }}><span className="badge" style={{ background: c + '1a', color: c }}>{cn(t[4], t[5])}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function Placeholder({ title }: { title: string }) {
  const { s, L } = useStore();
  return (
    <div className="card" style={{ padding: '60px 32px', textAlign: 'center', maxWidth: 560, margin: '20px auto' }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: '#E1F0F1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#13737A' }}><Icon name="layers" size={30} /></div>
      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20 }}>{title}</div>
      <div style={{ fontSize: 14, color: '#6B7280', marginTop: 10, lineHeight: 1.6, maxWidth: 400, marginInline: 'auto' }}>{L.placeholderBody}</div>
      <div style={{ marginTop: 20, fontSize: 12, color: '#9CA3AF' }}>{L['r_' + s.role]} · {title}</div>
    </div>
  );
}
