import { Icon } from '../icons';
import { useStore } from '../store';
import { ROSTER } from '../data';
import { StatGrid, useStatCards, SectionTitle } from '../components/ui';

export function InstructorDashboard() {
  const { L, cn, nav } = useStore();
  const stats = useStatCards();
  const classes: [string, string, number, string, string][] = [
    ['CS301', cn('Data Structures', 'هياكل البيانات'), 35, cn('Sun/Tue 09:00', 'أحد/ثلاثاء ٠٩:٠٠'), 'B-204'],
    ['CS340', cn('Operating Systems', 'نظم التشغيل'), 28, cn('Mon/Wed 11:00', 'إثنين/أربعاء ١١:٠٠'), 'A-110'],
    ['CS410', cn('Machine Learning', 'تعلم الآلة'), 33, cn('Thu 10:00', 'خميس ١٠:٠٠'), 'B-210'],
  ];
  return (
    <>
      <StatGrid items={stats} />
      <SectionTitle>{L.myClasses}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
        {classes.map((c) => (
          <div key={c[0]} className="card card-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div><div style={{ fontWeight: 800, color: '#13737A' }}>{c[0]}</div><div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{c[1]}</div></div>
              <span className="badge" style={{ background: '#FDF0DE', color: '#92400E' }}>{c[2]} 👥</span>
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', margin: '12px 0' }}>{c[3]} · {c[4]}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-tint" style={{ flex: 1 }} onClick={() => nav('attendance')}>{L.m_attendance}</button>
              <button style={{ flex: 1, padding: 8, background: '#FDF0DE', color: '#92400E', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => nav('grades')}>{L.gradeEntry}</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function InstructorAttendance() {
  const { s, L, ar, cn, setAtt, allAtt, toast } = useStore();
  const pb = (on: boolean, color: string): React.CSSProperties => ({ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid ' + (on ? color : '#E8EAED'), background: on ? color : '#fff', color: on ? '#fff' : '#6B7280' });
  return (
    <div className="tbl-wrap">
      <div style={{ padding: '16px 22px', borderBottom: '1px solid #F1F3F4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>CS301 · {cn('July 24, 2026', '٢٤ تموز ٢٠٢٦')}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ padding: '8px 14px', background: '#DCFCE7', color: '#166534', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => allAtt('p', ROSTER.map((r) => r[2]))}>{L.markAllPresent}</button>
          <button style={{ padding: '8px 14px', background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => allAtt('a', ROSTER.map((r) => r[2]))}>{L.markAllAbsent}</button>
        </div>
      </div>
      {ROSTER.map((r) => {
        const v = s.att[r[2]];
        return (
          <div key={r[2]} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 22px', borderBottom: '1px solid #F1F3F4' }}>
            <div className="avatar" style={{ width: 36, height: 36, fontSize: 13, background: '#DBEAFE', color: '#1E40AF' }}>{(ar ? r[1] : r[0]).slice(0, 1)}</div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{cn(r[0], r[1])}</div><div style={{ fontSize: 12, color: '#9CA3AF' }}>{r[2]}</div></div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={pb(v === 'p', '#10B981')} onClick={() => setAtt(r[2], 'p')}>{L.present}</button>
              <button style={pb(v === 'a', '#EF4444')} onClick={() => setAtt(r[2], 'a')}>{L.absent}</button>
            </div>
          </div>
        );
      })}
      <div style={{ padding: '16px 22px', textAlign: 'end' }}>
        <button className="btn-primary" style={{ width: 'auto', display: 'inline-flex' }} onClick={() => toast(cn('Attendance submitted', 'تم إرسال الحضور'))}>{L.submitAttendance}</button>
      </div>
    </div>
  );
}

export function InstructorGrades() {
  const { L, ar, cn, toast } = useStore();
  const scores = [88, 76, 92, 64, 81, 95];
  return (
    <div className="tbl-wrap">
      <div className="tbl-head">CS301 · {L.gradeEntry} — {L.thAssessment}: Final Exam (40%)</div>
      {ROSTER.map((r, i) => (
        <div key={r[2]} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 22px', borderBottom: '1px solid #F1F3F4' }}>
          <div className="avatar" style={{ width: 36, height: 36, fontSize: 13, background: '#DBEAFE', color: '#1E40AF' }}>{(ar ? r[1] : r[0]).slice(0, 1)}</div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{cn(r[0], r[1])}</div><div style={{ fontSize: 12, color: '#9CA3AF' }}>{r[2]}</div></div>
          <input defaultValue={scores[i]} style={{ width: 70, padding: '8px 10px', border: '1.5px solid #E8EAED', borderRadius: 8, textAlign: 'center', fontWeight: 600, outline: 'none' }} />
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>/ 100</span>
        </div>
      ))}
      <div style={{ padding: '16px 22px', textAlign: 'end' }}>
        <button className="btn-primary" style={{ width: 'auto', display: 'inline-flex' }} onClick={() => toast(cn('Grades saved', 'تم حفظ الدرجات'))}>{L.saveGrades}</button>
      </div>
    </div>
  );
}

export function InstructorAnnouncements() {
  const { L, cn, toast } = useStore();
  const ann: [string, string, string, string][] = [
    [cn('Jul 22', '٢٢ تموز'), '#EF4444', cn('Quiz 3 moved to Sunday', 'نُقل الاختبار ٣ للأحد'), cn('New date posted on the portal.', 'نُشر الموعد الجديد على البوابة.')],
    [cn('Jul 19', '١٩ تموز'), '#13737A', cn('Project groups finalized', 'تم تحديد مجموعات المشروع'), cn('Check your group under Classes.', 'راجع مجموعتك في الصفوف.')],
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
      <div className="card card-pad">
        <SectionTitle>{L.createAnn}</SectionTitle>
        <label className="field-label">{L.annTitle}</label>
        <input className="inp" style={{ marginBottom: 14 }} />
        <label className="field-label">{L.annMsg}</label>
        <textarea className="inp" style={{ minHeight: 96, marginBottom: 14, resize: 'vertical' }} />
        <label className="field-label">{L.annClasses}</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0 16px' }}>
          <span className="badge" style={{ background: '#E1F0F1', color: '#13737A' }}>CS301 ✓</span>
          <span className="badge" style={{ background: '#E1F0F1', color: '#13737A' }}>CS340 ✓</span>
          <span className="badge" style={{ background: '#F1F3F4', color: '#6B7280' }}>CS410</span>
        </div>
        <button className="btn-primary" onClick={() => toast(cn('Announcement published', 'تم نشر الإعلان'))}>{L.publish}</button>
      </div>
      <div className="card card-pad">
        <SectionTitle>{L.pastAnn}</SectionTitle>
        {ann.map((a, i) => (
          <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid #F1F3F4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: a[1] }} /><span style={{ fontSize: 11, color: '#9CA3AF' }}>{a[0]}</span></div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{a[2]}</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2, lineHeight: 1.5 }}>{a[3]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
