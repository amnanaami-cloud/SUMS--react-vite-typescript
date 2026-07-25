import { useStore } from '../store';
import { StatGrid, useStatCards, SectionTitle } from '../components/ui';

export function RegistrarDashboard() {
  const { L, cn } = useStore();
  const stats = useStatCards();
  const dates: [string, string, string][] = [
    [cn('Add/Drop deadline', 'آخر موعد للإضافة/الحذف'), cn('August 5, 2026', '٥ آب ٢٠٢٦'), '#EF4444'],
    [cn('Registration opens', 'فتح التسجيل'), cn('July 28, 2026', '٢٨ تموز ٢٠٢٦'), '#10B981'],
    [cn('Term starts', 'بداية الفصل'), cn('September 1, 2026', '١ أيلول ٢٠٢٦'), '#3B82F6'],
    [cn('Fee payment deadline', 'آخر موعد لدفع الرسوم'), cn('August 20, 2026', '٢٠ آب ٢٠٢٦'), '#F59E0B'],
  ];
  return (
    <>
      <StatGrid items={stats} />
      <div className="card card-pad">
        <SectionTitle>{L.importantDates}</SectionTitle>
        {dates.map((d, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, padding: '11px 0', borderBottom: '1px solid #F1F3F4' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: d[2], marginTop: 6 }} />
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{d[0]}</div><div style={{ fontSize: 12, color: '#6B7280' }}>{d[1]}</div></div>
          </div>
        ))}
      </div>
    </>
  );
}

export function RegistrarCourses() {
  const { L, cn } = useStore();
  const data: [string, string, number, string, number, number][] = [
    ['CS301', cn('Data Structures', 'هياكل البيانات'), 3, cn('Dr. Khalil', 'د. خليل'), 2, 68],
    ['CS340', cn('Operating Systems', 'نظم التشغيل'), 3, cn('Dr. Odeh', 'د. عودة'), 1, 28],
    ['CS355', cn('Database Systems', 'نظم قواعد البيانات'), 3, cn('Dr. Saleh', 'د. صالح'), 2, 55],
    ['MATH210', cn('Linear Algebra', 'الجبر الخطي'), 3, cn('Dr. Barghouti', 'د. البرغوثي'), 3, 96],
    ['ENG201', cn('Technical Writing', 'الكتابة التقنية'), 2, cn('Ms. Haddad', 'أ. حداد'), 2, 70],
  ];
  return (
    <div className="tbl-wrap">
      <div style={{ padding: '14px 22px', borderBottom: '1px solid #F1F3F4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{cn('Fall 2026', 'خريف ٢٠٢٦')}</div>
        <button className="btn-teal" style={{ padding: '8px 16px' }}>+ {L.addCourse}</button>
      </div>
      <table>
        <thead><tr><th style={{ paddingInlineStart: 22 }}>{L.thCode}</th><th>{L.thCourse}</th><th style={{ textAlign: 'center' }}>{L.creditsLabel}</th><th>{L.staffMembers}</th><th style={{ textAlign: 'center' }}>{L.sectionsCol}</th><th style={{ textAlign: 'center', paddingInlineEnd: 22 }}>{L.enrolledCol}</th></tr></thead>
        <tbody>
          {data.map((c) => (
            <tr key={c[0]}>
              <td style={{ paddingInlineStart: 22, fontWeight: 700, color: '#13737A' }}>{c[0]}</td>
              <td>{c[1]}</td>
              <td style={{ textAlign: 'center' }}>{c[2]}</td>
              <td>{c[3]}</td>
              <td style={{ textAlign: 'center' }}>{c[4]}</td>
              <td style={{ textAlign: 'center', paddingInlineEnd: 22, fontWeight: 600 }}>{c[5]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RegistrarMonitoring() {
  const { s, L, cn, setRegFilter, toast } = useStore();
  const filters: [string, string][] = [['submitted', cn('Submitted', 'مُرسل')], ['approved', cn('Approved', 'معتمد')], ['finalized', cn('Finalized', 'منجز')], ['rejected', cn('Rejected', 'مرفوض')]];
  const data: [string, string, number, string, string, string, string][] = [
    ['Omar Haddad', 'عمر حداد', 12, 'Approved', 'معتمد', 'Submitted', 'مُرسل'],
    ['Sara Mansour', 'سارة منصور', 15, 'Pending', 'معلق', 'Submitted', 'مُرسل'],
    ['Nour Khalil', 'نور خليل', 18, 'Approved', 'معتمد', 'Flagged', 'مُعلّم'],
    ['Rami Saleh', 'رامي صالح', 9, 'Approved', 'معتمد', 'Finalized', 'منجز'],
    ['Yousef Ali', 'يوسف علي', 6, 'Rejected', 'مرفوض', 'Rejected', 'مرفوض'],
  ];
  return (
    <>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {filters.map((f) => (
          <span key={f[0]} className={'pill' + (s.regFilter === f[0] ? ' active' : '')} onClick={() => setRegFilter(f[0])}>{f[1]}</span>
        ))}
      </div>
      <div className="tbl-wrap">
        <table>
          <thead><tr><th style={{ paddingInlineStart: 22 }}>{L.thName}</th><th style={{ textAlign: 'center' }}>{L.creditsLabel}</th><th style={{ textAlign: 'center' }}>{L.advisor}</th><th style={{ textAlign: 'center' }}>{L.thStatus}</th><th /></tr></thead>
          <tbody>
            {data.map((r, i) => {
              const sc = r[5] === 'Finalized' ? '#10B981' : r[5] === 'Rejected' ? '#EF4444' : r[5] === 'Flagged' ? '#F59E0B' : '#3B82F6';
              const ac = r[3] === 'Approved' ? '#10B981' : r[3] === 'Rejected' ? '#EF4444' : '#F59E0B';
              return (
                <tr key={i}>
                  <td style={{ paddingInlineStart: 22, fontWeight: 600 }}>{cn(r[0], r[1])}</td>
                  <td style={{ textAlign: 'center' }}>{r[2]}</td>
                  <td style={{ textAlign: 'center' }}><span className="badge" style={{ background: ac + '1a', color: ac }}>{cn(r[3], r[4])}</span></td>
                  <td style={{ textAlign: 'center' }}><span className="badge" style={{ background: sc + '1a', color: sc }}>{cn(r[5], r[6])}</span></td>
                  <td style={{ textAlign: 'center', paddingInlineEnd: 22 }}><button className="btn-teal" style={{ padding: '6px 14px' }} onClick={() => toast(cn('Registration finalized', 'تم اعتماد التسجيل'))}>{L.finalize}</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
