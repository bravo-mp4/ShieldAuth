export default function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="modalHeader">
            <h2 className="modalTitle">{title}</h2>
            <button className="modalClose" onClick={onClose}>
              ×
            </button>
          </div>
        )}

        <div className="modalBody">{children}</div>

        {footer && <div className="modalFooter">{footer}</div>}
      </div>
    </div>
  );
}
