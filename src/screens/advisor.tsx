import { useStore } from '../store';
import { StatGrid, useStatCards } from '../components/ui';

function ApprovalsList() {
  const { L, cn, openModal } = useStore();
  const apps: [string, string, string][] = [
    ['O', cn('Omar Haddad', 'عمر حداد'), cn('4 courses · 12 credits · submitted 2h ago', '٤ مواد · ١٢ ساعة · قبل ساعتين')],
    ['S', cn('Sara Mansour', 'سارة منصور'), cn('5 courses · 15 credits · submitted 5h ago', '٥ مواد · ١٥ ساعة · قبل ٥ ساعات')],
    ['R', cn('Rami Saleh', 'رامي صالح'), cn('3 courses · 9 credits · submitted 1d ago', '٣ مواد · ٩ ساعات · قبل يوم')],
  ];
  return (
    <div className="tbl-wrap">
      <div className="tbl-head">{L.pendingApprovals}</div>
      {apps.map((a, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 22px', borderBottom: '1px solid #F1F3F4' }}>
          <div className="avatar" style={{ width: 40, height: 40, fontSize: 14, background: '#DBEAFE', color: '#1E40AF' }}>{a[0]}</div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{a[1]}</div><div style={{ fontSize: 12, color: '#6B7280' }}>{a[2]}</div></div>
          <button className="btn-teal" onClick={() => openModal('approval')}>{L.review}</button>
        </div>
      ))}
    </div>
  );
}

export function AdvisorDashboard() {
  const stats = useStatCards();
  return (<><StatGrid items={stats} /><ApprovalsList /></>);
}

export function AdvisorApprovals() {
  return <ApprovalsList />;
}
