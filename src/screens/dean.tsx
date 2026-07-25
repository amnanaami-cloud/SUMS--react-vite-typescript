import { useStore } from '../store';
import { StatGrid, useStatCards, SectionTitle, Bar } from '../components/ui';

function DeanChart() {
  const trend: [string, number][] = [['F24', 7480], ['S25', 7720], ['F25', 8010], ['S26', 8210], ['F26', 8420]];
  const max = 8600;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, height: 200, width: '100%' }}>
      {trend.map((t, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>{t[1].toLocaleString()}</div>
          <div style={{ width: '100%', maxWidth: 46, height: `${(t[1] / max) * 100}%`, background: i === trend.length - 1 ? 'linear-gradient(180deg,#D4AF37,#13737A)' : '#13737A', borderRadius: '8px 8px 0 0' }} />
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>{t[0]}</div>
        </div>
      ))}
    </div>
  );
}

export function DeanDashboard() {
  const { L, cn } = useStore();
  const stats = useStatCards();
  const colleges: [string, string, number][] = [
    [cn('Engineering & IT', 'الهندسة وتقنية المعلومات'), '2,910', 100], [cn('Business', 'إدارة الأعمال'), '2,140', 74], [cn('Arts', 'الآداب'), '1,680', 58], [cn('Science', 'العلوم'), '1,690', 58],
  ];
  return (
    <>
      <StatGrid items={stats} />
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
        <div className="card card-pad"><SectionTitle style={{ marginBottom: 20 }}>{L.enrollmentTrend}</SectionTitle><DeanChart /></div>
        <div className="card card-pad">
          <SectionTitle>{L.byCollege}</SectionTitle>
          {colleges.map((c, i) => (
            <div key={i} style={{ padding: '11px 0', borderBottom: '1px solid #F1F3F4' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}><span style={{ fontWeight: 600 }}>{c[0]}</span><span style={{ color: '#6B7280' }}>{c[1]}</span></div>
              <Bar pct={c[2]} color="#13737A" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function DeanAnalytics() {
  const { L, cn } = useStore();
  const gpa: [string, number][] = [[cn('4.0–3.5', 'ممتاز'), 34], [cn('3.5–3.0', 'جيد جداً'), 38], [cn('3.0–2.5', 'جيد'), 19], [cn('<2.5', 'مقبول'), 9]];
  const ret: [string, number][] = [[cn('Year 1', 'السنة ١'), 86], [cn('Year 2', 'السنة ٢'), 91], [cn('Year 3', 'السنة ٣'), 94], [cn('Year 4', 'السنة ٤'), 96]];
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card card-pad"><SectionTitle style={{ marginBottom: 20 }}>{L.enrollmentTrend}</SectionTitle><DeanChart /></div>
        <div className="card card-pad">
          <SectionTitle>{L.gpaDistribution}</SectionTitle>
          {gpa.map((g, i) => (
            <div key={i} style={{ padding: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}><span style={{ fontWeight: 600 }}>{g[0]}</span><span style={{ color: '#6B7280' }}>{g[1]}%</span></div>
              <Bar pct={g[1]} color="#D4AF37" />
            </div>
          ))}
        </div>
      </div>
      <div className="card card-pad">
        <SectionTitle>{L.retentionByYear}</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
          {ret.map((r, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#13737A' }}>{r[1]}%</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{r[0]}</div>
              <Bar pct={r[1]} color="#10B981" h={6} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function DeanPlanning() {
  const { L, cn } = useStore();
  const k: [string, string, string, number][] = [
    [cn('Enrollment target 2030', 'هدف التسجيل ٢٠٣٠'), '8,420', '10,000', 84],
    [cn('Faculty-student ratio', 'نسبة الهيئة للطلاب'), '1:22', '1:18', 78],
    [cn('Research output (papers)', 'الإنتاج البحثي (أوراق)'), '142', '200', 71],
    [cn('Graduate employment', 'توظيف الخريجين'), '81%', '90%', 90],
  ];
  return (
    <>
      <SectionTitle>{L.strategicMetrics}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
        {k.map((x, i) => (
          <div key={i} className="card card-pad">
            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', minHeight: 38 }}>{x[0]}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10 }}><span style={{ fontSize: 28, fontWeight: 800, color: '#13737A' }}>{x[1]}</span><span style={{ fontSize: 13, color: '#9CA3AF' }}>/ {x[2]} {L.targetL}</span></div>
            <Bar pct={x[3]} color="linear-gradient(90deg,#13737A,#D4AF37)" h={8} />
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>{x[3]}% {L.completionL}</div>
          </div>
        ))}
      </div>
    </>
  );
}

/** Shared settings sections (light + dark variants) */
export function useSettingsSections(): { name: string; rows: { label: string; value: string; toggle: boolean }[] }[] {
  const { ar, cn } = useStore();
  return [
    { name: cn('General', 'عام'), rows: [{ label: cn('University name', 'اسم الجامعة'), value: 'University of Palestine', toggle: false }, { label: cn('Academic year', 'السنة الأكاديمية'), value: '2026 / 2027', toggle: false }, { label: cn('Default language', 'اللغة الافتراضية'), value: ar ? 'العربية' : 'Arabic', toggle: false }] },
    { name: cn('Academic', 'أكاديمي'), rows: [{ label: cn('GPA scale', 'مقياس المعدل'), value: '4.0', toggle: false }, { label: cn('Probation threshold', 'حد الإنذار'), value: '2.00', toggle: false }, { label: cn('Require advisor approval', 'طلب موافقة المرشد'), value: '', toggle: true }] },
    { name: cn('Security', 'الأمان'), rows: [{ label: cn('Two-factor authentication', 'المصادقة الثنائية'), value: '', toggle: true }, { label: cn('Session timeout', 'انتهاء الجلسة'), value: cn('30 min', '٣٠ دقيقة'), toggle: false }, { label: cn('Password min length', 'أدنى طول لكلمة المرور'), value: '8', toggle: false }] },
  ];
}

export function SettingsBlock({ dark }: { dark: boolean }) {
  const sections = useSettingsSections();
  const track = dark ? '#FBCA89' : '#13737A';
  const knob = dark ? '#1F2937' : '#fff';
  return (
    <>
      {sections.map((sec, i) => (
        <div key={i} className="card" style={{ overflow: 'hidden', ...(dark ? { background: '#1F2937', border: '1px solid #374151' } : {}) }}>
          <div style={{ padding: '14px 22px', fontWeight: 700, fontSize: 15, borderBottom: '1px solid ' + (dark ? '#374151' : '#F1F3F4'), ...(dark ? { color: '#F9FAFB' } : {}) }}>{sec.name}</div>
          {sec.rows.map((r, j) => (
            <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px', borderBottom: '1px solid ' + (dark ? '#2b3543' : '#F8F9FA') }}>
              <span style={{ fontSize: 14, color: dark ? '#D1D5DB' : '#374151' }}>{r.label}</span>
              {r.toggle ? (
                <span style={{ width: 42, height: 24, background: track, borderRadius: 999, position: 'relative', display: 'inline-block' }}><span style={{ position: 'absolute', insetInlineEnd: 3, top: 3, width: 18, height: 18, background: knob, borderRadius: '50%' }} /></span>
              ) : (
                <span style={{ fontSize: 14, fontWeight: 600, color: dark ? '#F9FAFB' : '#1F2937' }}>{r.value}</span>
              )}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

export function DeanSettings() {
  const { L, cn, toast } = useStore();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
      <SettingsBlock dark={false} />
      <button className="btn-primary" style={{ width: 'auto', alignSelf: 'flex-start', padding: '11px 22px' }} onClick={() => toast(cn('Settings saved', 'تم حفظ الإعدادات'))}>{L.applyChanges}</button>
    </div>
  );
}

function DeptApprovalsBlock() {
  const { L, cn, toast } = useStore();
  const list: [string, string, string, string][] = [
    ['CS301', cn('Data Structures', 'هياكل البيانات'), cn('Dr. Khalil', 'د. خليل'), cn('35 students', '٣٥ طالب')],
    ['CS340', cn('Operating Systems', 'نظم التشغيل'), cn('Dr. Odeh', 'د. عودة'), cn('28 students', '٢٨ طالب')],
    ['CS355', cn('Database Systems', 'نظم قواعد البيانات'), cn('Dr. Saleh', 'د. صالح'), cn('30 students', '٣٠ طالب')],
    ['CS410', cn('Machine Learning', 'تعلم الآلة'), cn('Dr. Nassar', 'د. نصار'), cn('33 students', '٣٣ طالب')],
  ];
  return (
    <div className="tbl-wrap">
      <div className="tbl-head">{L.gradeApprovals}</div>
      {list.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 22px', borderBottom: '1px solid #F1F3F4' }}>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{d[0]} · {d[1]}</div><div style={{ fontSize: 12, color: '#6B7280' }}>{d[2]} · {d[3]}</div></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ padding: '7px 15px', background: '#DCFCE7', color: '#166534', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => toast(cn('Grade sheet approved', 'تم اعتماد كشف الدرجات'))}>{L.approve}</button>
            <button style={{ padding: '7px 15px', background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => toast(cn('Grade sheet returned', 'تمت إعادة كشف الدرجات'))}>{L.reject}</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DeptDashboard() {
  const stats = useStatCards();
  return (<><StatGrid items={stats} /><DeptApprovalsBlock /></>);
}
export function DeptApprovals() { return <DeptApprovalsBlock />; }

export function DeptStaff() {
  const { L, ar, cn } = useStore();
  const staff: [string, string, string, number, number, string][] = [
    ['Dr. Ahmad Khalil', 'د. أحمد خليل', cn('Professor', 'أستاذ'), 3, 96, '#FBCA89'],
    ['Dr. Mona Saleh', 'د. منى صالح', cn('Associate Prof.', 'أستاذ مشارك'), 2, 58, '#A7F3D0'],
    ['Dr. Sami Odeh', 'د. سامي عودة', cn('Assistant Prof.', 'أستاذ مساعد'), 2, 61, '#BFDBFE'],
    ['Ms. Rana Haddad', 'أ. رنا حداد', cn('Lecturer', 'محاضر'), 4, 120, '#FBCFE8'],
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
      {staff.map((s, i) => (
        <div key={i} className="card card-pad" style={{ textAlign: 'center' }}>
          <div className="avatar" style={{ width: 64, height: 64, fontSize: 24, background: s[5], margin: '0 auto 12px' }}>{(ar ? s[1] : s[0]).replace('Dr. ', '').replace('Ms. ', '').slice(0, 1)}</div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{cn(s[0], s[1])}</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{s[2]}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 14, fontSize: 13 }}>
            <div><div style={{ fontWeight: 800, color: '#13737A' }}>{s[3]}</div><div style={{ fontSize: 11, color: '#9CA3AF' }}>{L.m_courses}</div></div>
            <div><div style={{ fontWeight: 800, color: '#13737A' }}>{s[4]}</div><div style={{ fontSize: 11, color: '#9CA3AF' }}>{L.m_students}</div></div>
          </div>
        </div>
      ))}
    </div>
  );
}
