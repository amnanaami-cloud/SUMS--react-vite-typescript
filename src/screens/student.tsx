import { Icon } from '../icons';
import { useStore } from '../store';
import { COURSES, GRADES, ATT, TS, NAMES } from '../data';
import { StatGrid, useStatCards, SectionTitle, Bar, Badge, GradeBadge } from '../components/ui';

export function StudentDashboard() {
  const { L, ar, cn } = useStore();
  const stats = useStatCards();
  const nm = NAMES.student;
  const sched: [string, string, string, string, string, string][] = [
    ['09:00', 'B-204', cn('Data Structures', 'هياكل البيانات'), 'CS301', cn('Dr. Khalil', 'د. خليل'), '#13737A'],
    ['11:00', 'A-110', cn('Operating Systems', 'نظم التشغيل'), 'CS340', cn('Dr. Odeh', 'د. عودة'), '#D4AF37'],
    ['12:30', 'B-201', cn('Database Systems', 'نظم قواعد البيانات'), 'CS355', cn('Dr. Saleh', 'د. صالح'), '#3B82F6'],
  ];
  const ann: [string, string, string, string][] = [
    [cn('Jul 22', '٢٢ تموز'), '#EF4444', cn('Final exam schedule posted', 'نشر جدول الامتحانات النهائية'), cn('Check your exam times under Transcript.', 'راجع مواعيد امتحاناتك في كشف الدرجات.')],
    [cn('Jul 20', '٢٠ تموز'), '#13737A', cn('Add/Drop deadline: Aug 5', 'آخر موعد للإضافة/الحذف: ٥ آب'), cn('Changes after this date need approval.', 'التغييرات بعد هذا التاريخ تحتاج موافقة.')],
    [cn('Jul 18', '١٨ تموز'), '#D4AF37', cn('Library hours extended', 'تمديد ساعات المكتبة'), cn('Open until midnight during finals.', 'مفتوحة حتى منتصف الليل خلال الامتحانات.')],
  ];
  return (
    <>
      <div className="hero">
        <div>
          <div style={{ fontSize: 14, opacity: 0.85 }}>{L.welcome}</div>
          <div className="name">{nm[ar ? 1 : 0]}</div>
          <div style={{ fontSize: 13, opacity: 0.8, marginTop: 6 }}>{cn('Computer Science', 'علوم الحاسوب')} · {L.yearLabel} {ar ? '٣' : '3'} · ID 2021054</div>
        </div>
        <div className="gpa-box"><div className="big">3.62</div><div style={{ fontSize: 12, opacity: 0.85 }}>{L.cumGpa}</div></div>
      </div>
      <StatGrid items={stats} />
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        <div className="card card-pad">
          <SectionTitle>{L.todaySchedule}</SectionTitle>
          {sched.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: '1px solid #F1F3F4' }}>
              <div style={{ textAlign: 'center', flex: 'none', width: 66 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#13737A' }}>{t[0]}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>{t[1]}</div>
              </div>
              <div style={{ width: 3, borderRadius: 2, background: t[5] }} />
              <div><div style={{ fontWeight: 600, fontSize: 14 }}>{t[2]}</div><div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{t[3]} · {t[4]}</div></div>
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

export function StudentRegistration() {
  const { s, L, cn, toggleCart, toast } = useStore();
  const cartItems = COURSES.filter((c) => s.cart.includes(c.code));
  const credits = cartItems.reduce((a, c) => a + c.cr, 0);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
      <div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', marginBottom: 16 }}>
          <span style={{ color: '#9CA3AF' }}><Icon name="search" size={18} /></span>
          <input placeholder={L.searchCourses} style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, background: 'none' }} />
          <span style={{ fontSize: 12, color: '#6B7280', background: '#F1F3F4', padding: '5px 12px', borderRadius: 999 }}>{cn('Fall 2026', 'خريف ٢٠٢٦')}</span>
        </div>
        {COURSES.map((c) => {
          const inCart = s.cart.includes(c.code); const full = c.seats === 0;
          const cap = full ? '#EF4444' : c.seats < 5 ? '#F59E0B' : '#10B981';
          return (
            <div key={c.code} className="card" style={{ padding: '18px 20px', marginBottom: 12, border: '1.5px solid ' + (inCart ? '#13737A' : 'transparent') }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, color: '#13737A', fontSize: 15 }}>{c.code}</span>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{cn(c.en, c.ar)}</span>
                    <span className="badge" style={{ background: '#E1F0F1', color: '#13737A' }}>{c.cr} {L.creditsLabel}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span><Icon name="clock" size={15} /> {cn(c.sch, c.schAr)}</span>
                    <span><Icon name="pin" size={15} /> {c.room}</span>
                    <span><Icon name="user" size={15} /> {cn(c.instr, c.instrAr)}</span>
                  </div>
                  <div style={{ fontSize: 12, marginTop: 8, color: cap }}>{full ? cn('Full — waitlist', 'ممتلئة — قائمة انتظار') : c.seats + ' ' + cn('seats left', 'مقعد متبقٍ')} · {L.prereq}: {c.pre}</div>
                </div>
                {full ? (
                  <button className="btn-teal" style={{ background: '#F1F3F4', color: '#9CA3AF', cursor: 'not-allowed' }}>{cn('Full', 'ممتلئة')}</button>
                ) : (
                  <button onClick={() => toggleCart(c.code)} className={inCart ? '' : 'btn-teal'} style={inCart ? { padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: '#FEE2E2', color: '#991B1B' } : undefined}>{inCart ? L.remove : L.add}</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="card" style={{ overflow: 'hidden', position: 'sticky', top: 0 }}>
        <div style={{ background: '#13737A', color: '#fff', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}><Icon name="cart" size={19} />{L.cart}</div>
        <div style={{ padding: '16px 20px' }}>
          {cartItems.length ? cartItems.map((c) => (
            <div key={c.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F1F3F4' }}>
              <div><div style={{ fontWeight: 600, fontSize: 13 }}>{c.code}</div><div style={{ fontSize: 11, color: '#6B7280' }}>{cn(c.en, c.ar)}</div></div>
              <button onClick={() => toggleCart(c.code)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{L.remove}</button>
            </div>
          )) : <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '24px 0' }}>{L.cartEmpty}</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 16, paddingTop: 14, borderTop: '2px solid #F1F3F4' }}><span>{L.totalCredits}</span><span style={{ color: '#13737A' }}>{credits}</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 9, padding: '9px 12px', marginTop: 14, fontSize: 12, color: '#92400E' }}><Icon name="clock" size={15} />{L.approvalPending}</div>
          <button className="btn-primary" style={{ marginTop: 14 }} onClick={() => toast(cn('Registration submitted for advisor approval', 'تم إرسال التسجيل لموافقة المرشد'))}>{L.submitReg}</button>
        </div>
      </div>
    </div>
  );
}

export function StudentCourses() {
  const { L, cn } = useStore();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {COURSES.map((c) => (
        <div key={c.code} className="card" style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontWeight: 800, color: '#13737A' }}>{c.code}</span>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{cn(c.en, c.ar)}</span>
              <span className="badge" style={{ background: '#E1F0F1', color: '#13737A' }}>{c.cr} {L.creditsLabel}</span>
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span><Icon name="clock" size={15} /> {cn(c.sch, c.schAr)}</span>
              <span><Icon name="pin" size={15} /> {c.room}</span>
              <span><Icon name="user" size={15} /> {cn(c.instr, c.instrAr)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-tint">{L.syllabus}</button>
            <button style={{ padding: '9px 16px', background: '#fff', color: '#EF4444', border: '1px solid #FCA5A5', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{L.dropCourse}</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StudentGrades() {
  const { L, cn } = useStore();
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
        <div className="card card-pad" style={{ textAlign: 'center' }}><div style={{ fontSize: 13, color: '#6B7280' }}>{L.cumGpa}</div><div style={{ fontSize: 32, fontWeight: 800, color: '#13737A', marginTop: 6 }}>3.62</div></div>
        <div className="card card-pad" style={{ textAlign: 'center' }}><div style={{ fontSize: 13, color: '#6B7280' }}>{L.semGpa}</div><div style={{ fontSize: 32, fontWeight: 800, marginTop: 6 }}>3.74</div></div>
        <div className="card card-pad" style={{ textAlign: 'center' }}><div style={{ fontSize: 13, color: '#6B7280' }}>{L.standing}</div><div style={{ fontSize: 20, fontWeight: 700, color: '#10B981', marginTop: 12 }}>{L.goodStanding}</div></div>
      </div>
      <div className="tbl-wrap">
        <div className="tbl-head">{L.semesterGrades} · {cn('Fall 2026', 'خريف ٢٠٢٦')}</div>
        <table>
          <thead><tr><th style={{ paddingInlineStart: 22 }}>{L.thCode}</th><th>{L.thCourse}</th><th style={{ textAlign: 'center' }}>{L.creditsLabel}</th><th style={{ textAlign: 'center' }}>{L.gradeLabel}</th><th style={{ textAlign: 'center', paddingInlineEnd: 22 }}>{L.pointsLabel}</th></tr></thead>
          <tbody>
            {GRADES.map((g) => (
              <tr key={g[0]}>
                <td style={{ paddingInlineStart: 22, fontWeight: 700, color: '#13737A' }}>{g[0]}</td>
                <td>{cn(g[1], g[2])}</td>
                <td style={{ textAlign: 'center' }}>{g[3]}</td>
                <td style={{ textAlign: 'center' }}><GradeBadge g={g[4] as string} /></td>
                <td style={{ textAlign: 'center', paddingInlineEnd: 22, fontWeight: 600 }}>{(g[5] as number).toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '14px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8F9FA' }}>
          <button className="btn-ghost">{L.gradeAppeal}</button>
          <a href="#" onClick={(e) => e.preventDefault()}>{L.viewAll} →</a>
        </div>
      </div>
    </>
  );
}

export function StudentAttendance() {
  const { L, cn } = useStore();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>
      <div className="card card-pad" style={{ textAlign: 'center' }}>
        <div className="progress-ring" style={{ background: 'conic-gradient(#10B981 0 88%,#F1F3F4 88%)' }}>
          <div className="hole"><div style={{ fontSize: 34, fontWeight: 800, color: '#10B981' }}>88%</div><div style={{ fontSize: 11, color: '#9CA3AF' }}>{L.overallAtt}</div></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: 13 }}>
          <div><div style={{ fontWeight: 800, fontSize: 20, color: '#EF4444' }}>6</div><div style={{ color: '#6B7280' }}>{L.absences}</div></div>
          <div><div style={{ fontWeight: 800, fontSize: 20, color: '#F59E0B' }}>3</div><div style={{ color: '#6B7280' }}>{L.tardies}</div></div>
        </div>
      </div>
      <div className="card card-pad">
        <SectionTitle>{L.byCourse}</SectionTitle>
        {ATT.map((a) => {
          const c = a[3] >= 85 ? '#10B981' : a[3] >= 75 ? '#F59E0B' : '#EF4444';
          return (
            <div key={a[0]} style={{ padding: '13px 0', borderBottom: '1px solid #F1F3F4' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 7 }}><span style={{ fontWeight: 600 }}>{a[0]} · {cn(a[1], a[2])}</span><span style={{ fontWeight: 700, color: c }}>{a[3]}%</span></div>
              <Bar pct={a[3]} color={c} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StudentTranscript() {
  const { L, cn } = useStore();
  const reqs: [string, string, string, string][] = [
    [cn('Core CS', 'متطلبات التخصص'), cn('48 / 60 cr', '٤٨ / ٦٠ س'), 'check', '#10B981'],
    [cn('Mathematics', 'الرياضيات'), cn('18 / 18 cr', '١٨ / ١٨ س'), 'check', '#10B981'],
    [cn('University Req.', 'متطلبات الجامعة'), cn('21 / 30 cr', '٢١ / ٣٠ س'), 'clock', '#F59E0B'],
    [cn('Electives', 'اختيارية'), cn('9 / 24 cr', '٩ / ٢٤ س'), 'clock', '#F59E0B'],
  ];
  return (
    <>
      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <SectionTitle style={{ margin: 0 }}>{L.degreeProgress}</SectionTitle>
          <button className="btn-teal"><Icon name="download" size={15} /> {L.printReceipt}</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}><span style={{ color: '#6B7280' }}>{L.creditsCompleted}</span><span style={{ fontWeight: 700 }}>96 / 132</span></div>
        <div style={{ height: 12, background: '#F1F3F4', borderRadius: 6, overflow: 'hidden', marginBottom: 20 }}><div style={{ height: '100%', width: '72%', background: 'linear-gradient(90deg,#13737A,#D4AF37)', borderRadius: 6 }} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
          {reqs.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#F8F9FA', borderRadius: 10 }}>
              <span style={{ color: r[3] }}><Icon name={r[2]} size={18} /></span>
              <div><div style={{ fontSize: 13, fontWeight: 600 }}>{r[0]}</div><div style={{ fontSize: 11, color: '#9CA3AF' }}>{r[1]}</div></div>
            </div>
          ))}
        </div>
      </div>
      <div className="tbl-wrap">
        <div className="tbl-head">{L.gradeHistory}</div>
        {TS.map((t) => (
          <div key={t[0]} style={{ padding: '16px 22px', borderBottom: '1px solid #F1F3F4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><div style={{ fontWeight: 600, fontSize: 14 }}>{cn(t[0], t[1])}</div><div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>{cn(t[2], t[3])} · {t[4]} {L.creditsLabel}</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, color: '#9CA3AF' }}>GPA</div><div style={{ fontWeight: 800, fontSize: 18, color: '#13737A' }}>{(t[5] as number).toFixed(2)}</div></div>
          </div>
        ))}
      </div>
    </>
  );
}
