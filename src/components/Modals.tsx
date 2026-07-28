import { Icon } from '../icons';
import { useStore } from '../store';

export function Modals() {
  const { s, L, closeModal } = useStore();
  if (s.modal === 'denied') {
    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div
          className="modal"
          style={{ maxWidth: 400, textAlign: 'center', padding: '34px 28px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-icon" style={{ background: '#FEE2E2', color: '#EF4444' }}>
            <Icon name="lock" size={26} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{L.accessDenied}</div>
          <div style={{ fontSize: 14, color: '#6B7280', marginTop: 8, lineHeight: 1.6 }}>{L.accessDeniedBody}</div>
          <button className="btn-primary" style={{ marginTop: 22 }} onClick={closeModal}>
            {L.goDashboard}
          </button>
        </div>
      </div>
    );
  }
  return null;
}

export function Toast() {
  const { toastMsg } = useStore();
  if (!toastMsg) return null;
  return (
    <div className="toast">
      <Icon name="check" size={16} />
      {toastMsg}
    </div>
  );
}
