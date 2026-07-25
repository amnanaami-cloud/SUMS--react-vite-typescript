import { Icon } from '../icons';
import { useStore } from '../store';
import { COURSES } from '../data';

export function Modals() {
  const { s, L, cn, closeModal } = useStore();
  if (s.modal === 'approval') {
    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F3F4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17 }}>{L.registrationApproval}</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>Layla Nassar · 2021054 · CS · {L.yearLabel} 3</div>
            </div>
            <button className="modal-x" onClick={closeModal}>✕</button>
          </div>
          <div style={{ padding: '20px 24px' }}>
            {COURSES.slice(0, 4).map((c) => (
              <div key={c.code} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F1F3F4', fontSize: 13 }}>
                <span><b style={{ color: '#13737A' }}>{c.code}</b> {cn(c.en, c.ar)}</span>
                <span style={{ color: '#6B7280' }}>{c.cr} {L.creditsLabel}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 12 }}><span>{L.totalCredits}</span><span style={{ color: '#13737A' }}>15</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#DCFCE7', color: '#166534', borderRadius: 9, padding: '10px 12px', marginTop: 14, fontSize: 13 }}><Icon name="check" size={16} /> {L.noIssues}</div>
            <textarea className="inp" placeholder={L.commentPlaceholder} style={{ marginTop: 14, minHeight: 60, resize: 'vertical' }} />
          </div>
          <div style={{ padding: '16px 24px', background: '#F8F9FA', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn-ghost" onClick={closeModal}>{L.requestCorrection}</button>
            <button style={{ padding: '10px 18px', background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: 'pointer' }} onClick={closeModal}>{L.reject}</button>
            <button className="btn-teal" onClick={closeModal}>{L.approve}</button>
          </div>
        </div>
      </div>
    );
  }
  if (s.modal === 'denied') {
    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal" style={{ maxWidth: 400, textAlign: 'center', padding: '34px 28px' }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-icon" style={{ background: '#FEE2E2', color: '#EF4444' }}><Icon name="lock" size={26} /></div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{L.accessDenied}</div>
          <div style={{ fontSize: 14, color: '#6B7280', marginTop: 8, lineHeight: 1.6 }}>{L.accessDeniedBody}</div>
          <button className="btn-primary" style={{ marginTop: 22 }} onClick={closeModal}>{L.goDashboard}</button>
        </div>
      </div>
    );
  }
  return null;
}

export function Toast() {
  const { toastMsg } = useStore();
  if (!toastMsg) return null;
  return <div className="toast"><Icon name="check" size={16} />{toastMsg}</div>;
}
