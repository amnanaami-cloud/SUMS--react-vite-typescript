import { Icon } from '../icons';
import { useStore } from '../store';
import { AUDIT, auditColor } from '../data';
import { SettingsBlock } from './dean';

export function AdminDashboard() {
  const { L, cn } = useStore();
  const stats: [string, string, string, string][] = [
    ['users', cn('Total Users', 'إجمالي المستخدمين'), '9,240', '#FBCA89'],
    ['check', cn('Active Now', 'نشط الآن'), '312', '#10B981'],
    ['shield', cn('Failed Logins', 'محاولات فاشلة'), '7', '#EF4444'],
    ['layers', cn('Uptime', 'مدة التشغيل'), '99.98%', '#3B82F6'],
  ];
  const health: [string, number, string][] = [[cn('CPU', 'المعالج'), 42, '#3B82F6'], [cn('Memory', 'الذاكرة'), 63, '#F59E0B'], [cn('Disk', 'القرص'), 28, '#10B981'], [cn('Network', 'الشبكة'), 55, '#8B5CF6']];
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#1F2937', border: '1px solid #374151', borderRadius: 14, padding: '18px 22px', marginBottom: 20 }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 0 4px rgba(16,185,129,.2)' }} />
        <div><div style={{ fontWeight: 700, fontSize: 15, color: '#F9FAFB' }}>{L.systemStatus}</div><div style={{ fontSize: 13, color: '#9CA3AF' }}>{L.online} · SUMS v1.0.0</div></div>
      </div>
      <div className="grid-stats">
        {stats.map((s, i) => (
          <div key={i} style={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div style={{ fontSize: 13, color: '#9CA3AF' }}>{s[1]}</div><span style={{ color: s[3] }}><Icon name={s[0]} /></span></div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: '#F9FAFB' }}>{s[2]}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>
        <div style={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 14, padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#F9FAFB', marginBottom: 16 }}>{L.serverHealth}</div>
          {health.map((h, i) => (
            <div key={i} style={{ padding: '9px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}><span style={{ color: '#D1D5DB' }}>{h[0]}</span><span style={{ color: '#9CA3AF' }}>{h[1]}%</span></div>
              <div style={{ height: 7, background: '#374151', borderRadius: 4, overflow: 'hidden' }}><div style={{ height: '100%', width: `${h[1]}%`, background: h[2], borderRadius: 4 }} /></div>
            </div>
          ))}
        </div>
        <div style={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', fontWeight: 700, fontSize: 15, color: '#F9FAFB', borderBottom: '1px solid #374151' }}>{L.recentActivity}</div>
          {AUDIT.map((l, i) => {
            const c = auditColor(l[3]);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 22px', borderBottom: '1px solid #374151' }}>
                <span className="badge" style={{ background: c + '2a', color: c, borderRadius: 6, padding: '2px 9px', fontSize: 11 }}>{l[3]}</span>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, color: '#F9FAFB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l[4]}</div><div style={{ fontSize: 11, color: '#9CA3AF' }}>{l[1]} · {l[0]}</div></div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function AdminUsers() {
  const { L, cn } = useStore();
  const users: [string, string, string, string, string, string, string, string][] = [
    ['1042', 'Layla Nassar', 'ليلى نصار', 'layla.nassar@up.edu.ps', cn('Student', 'طالب'), 'Active', 'نشط', '2h ago'],
    ['0087', 'Dr. Ahmad Khalil', 'د. أحمد خليل', 'a.khalil@up.edu.ps', cn('Instructor', 'محاضر'), 'Active', 'نشط', '15m ago'],
    ['0031', 'Kareem Odeh', 'كريم عودة', 'k.odeh@up.edu.ps', cn('Registrar', 'مسجّل'), 'Active', 'نشط', '1d ago'],
    ['0009', 'Mona Saleh', 'منى صالح', 'm.saleh@up.edu.ps', cn('Advisor', 'مرشد'), 'Locked', 'مقفل', '5d ago'],
    ['0002', 'System Admin', 'مدير النظام', 'admin@up.edu.ps', cn('Sys Admin', 'مدير'), 'Active', 'نشط', 'now'],
  ];
  return (
    <div style={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 22px', borderBottom: '1px solid #374151', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ color: '#9CA3AF' }}><Icon name="search" size={18} /></span>
        <input placeholder={L.searchStudents} style={{ flex: 1, minWidth: 160, border: 'none', outline: 'none', fontSize: 14, background: 'none', color: '#F9FAFB' }} />
        <button style={{ padding: '8px 16px', background: '#FBCA89', color: '#1F2937', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ {L.createUser}</button>
      </div>
      <table>
        <thead><tr style={{ background: '#111827', color: '#9CA3AF' }}><th style={{ paddingInlineStart: 22 }}>{L.thName}</th><th>{L.email}</th><th>{L.roleCol}</th><th style={{ textAlign: 'center' }}>{L.lastLogin}</th><th style={{ textAlign: 'center', paddingInlineEnd: 22 }}>{L.thStatus}</th></tr></thead>
        <tbody>
          {users.map((u) => {
            const c = u[5] === 'Active' ? '#10B981' : '#EF4444';
            return (
              <tr key={u[0]} style={{ color: '#E5E7EB' }}>
                <td style={{ paddingInlineStart: 22, fontWeight: 600 }}>{cn(u[1], u[2])}<div style={{ fontSize: 11, color: '#6B7280' }}>#{u[0]}</div></td>
                <td style={{ color: '#9CA3AF' }}>{u[3]}</td>
                <td>{u[4]}</td>
                <td style={{ textAlign: 'center', color: '#9CA3AF' }}>{u[7]}</td>
                <td style={{ textAlign: 'center', paddingInlineEnd: 22 }}><span className="badge" style={{ background: c + '2a', color: c }}>{cn(u[5], u[6])}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AdminRoles() {
  const { L, cn, toast } = useStore();
  const roles: [string, string][] = [[cn('Student', 'طالب'), '8,420'], [cn('Instructor', 'محاضر'), '420'], [cn('Advisor', 'مرشد'), '96'], [cn('Registrar', 'مسجّل'), '12'], [cn('Dept Head', 'رئيس قسم'), '18'], [cn('Dean', 'عميد'), '6']];
  const groups: [string, [string, number][]][] = [
    [cn('Identity', 'الهوية'), [[cn('View profile', 'عرض الملف'), 1], [cn('Edit profile', 'تعديل الملف'), 1], [cn('Change password', 'تغيير كلمة المرور'), 0]]],
    [cn('Students', 'الطلاب'), [[cn('View students', 'عرض الطلاب'), 1], [cn('Edit students', 'تعديل الطلاب'), 1], [cn('Deactivate', 'إلغاء تفعيل'), 0]]],
    [cn('Courses', 'المواد'), [[cn('View courses', 'عرض المواد'), 1], [cn('Create course', 'إنشاء مادة'), 0], [cn('Delete course', 'حذف مادة'), 0]]],
    [cn('Grades', 'الدرجات'), [[cn('Enter grades', 'إدخال الدرجات'), 1], [cn('Approve grades', 'اعتماد الدرجات'), 0], [cn('Appeal review', 'مراجعة الطعون'), 0]]],
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>
      <div style={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 14, padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#F9FAFB', marginBottom: 12, padding: '0 4px' }}>{L.m_roles}</div>
        {roles.map((r, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 10, marginBottom: 6, ...(i === 0 ? { background: '#374151', color: '#FBCA89' } : { color: '#D1D5DB' }) }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{r[0]}</span><span style={{ fontSize: 12, opacity: 0.7 }}>{r[1]}</span>
          </div>
        ))}
      </div>
      <div style={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#F9FAFB' }}>{L.permissions} · {L.r_student}</div>
          <button style={{ padding: '8px 16px', background: '#FBCA89', color: '#1F2937', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }} onClick={() => toast(cn('Permissions updated', 'تم تحديث الصلاحيات'))}>{L.applyChanges}</button>
        </div>
        <div style={{ padding: '8px 22px 18px' }}>
          {groups.map((g, i) => (
            <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid #374151' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#FBCA89', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>{g[0]}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {g[1].map((p, j) => (
                  <label key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#D1D5DB', cursor: 'pointer' }}>
                    <span style={{ width: 20, height: 20, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flex: 'none', ...(p[1] === 1 ? { background: '#FBCA89', color: '#1F2937' } : { background: '#374151', color: '#374151', border: '1px solid #4B5563' }) }}>{p[1] === 1 ? '✓' : ''}</span>
                    {p[0]}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminAudit() {
  const { L, cn, toast } = useStore();
  return (
    <div style={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 22px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#F9FAFB' }}>{L.m_audit}</div>
        <button style={{ padding: '8px 16px', background: '#374151', color: '#F9FAFB', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }} onClick={() => toast(cn('Logs exported', 'تم تصدير السجلات'))}>{L.exportRow}</button>
      </div>
      <table>
        <thead><tr style={{ background: '#111827', color: '#9CA3AF' }}><th style={{ paddingInlineStart: 22 }}>{L.semesterLabel}</th><th>{L.ipCol}</th><th style={{ textAlign: 'center' }}>{L.actionCol}</th><th>{L.resourceCol}</th><th style={{ paddingInlineEnd: 22 }}>{L.userCol}</th></tr></thead>
        <tbody>
          {AUDIT.map((l, i) => {
            const c = auditColor(l[3]);
            return (
              <tr key={i} style={{ color: '#E5E7EB' }}>
                <td style={{ paddingInlineStart: 22, color: '#9CA3AF' }}>{l[0]}</td>
                <td style={{ color: '#9CA3AF' }}>{l[2]}</td>
                <td style={{ textAlign: 'center' }}><span className="badge" style={{ background: c + '2a', color: c, borderRadius: 6, padding: '2px 9px', fontSize: 11 }}>{l[3]}</span></td>
                <td>{l[4]}</td>
                <td style={{ paddingInlineEnd: 22 }}>{l[1]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AdminSettings() {
  const { L, cn, toast } = useStore();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
      <SettingsBlock dark={true} />
      <button style={{ alignSelf: 'flex-start', padding: '11px 22px', background: '#FBCA89', color: '#1F2937', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: 'pointer' }} onClick={() => toast(cn('Settings saved', 'تم حفظ الإعدادات'))}>{L.applyChanges}</button>
    </div>
  );
}
