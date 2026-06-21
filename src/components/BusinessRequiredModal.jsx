import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './BusinessRequiredModal.css';

function BuildingIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M9 21V9"/>
    </svg>
  );
}

export default function BusinessRequiredModal({
  onDismiss,
  title = 'Business Account Required',
  message = 'This category is reserved for verified business accounts. Apply for Business verification to access this category.',
  primaryLabel = 'Apply for Business Account',
  onPrimary,
  primaryBusy = false,
  secondaryLabel = 'Choose Another Category',
}) {
  const navigate = useNavigate();
  const handlePrimary = onPrimary || (() => navigate('/login?register=business'));

  // Lock body scroll and handle Escape
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onDismiss(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [onDismiss]);

  return createPortal(
    <>
      {/* Backdrop */}
      <motion.div
        className="biz-modal__backdrop"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onDismiss}
      />

      {/* Modal */}
      <motion.div
        className="biz-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="biz-modal-title"
        style={{ x: '-50%', y: '-50%' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.14 } }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Dark header */}
        <div className="biz-modal__top">
          <div className="biz-modal__icon-wrap" aria-hidden="true">
            <BuildingIcon />
          </div>
        </div>

        {/* Body */}
        <div className="biz-modal__body">
          <h2 id="biz-modal-title" className="biz-modal__title">
            {title}
          </h2>
          <p className="biz-modal__message">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="biz-modal__actions">
          <button
            className="biz-modal__btn biz-modal__btn--primary"
            onClick={handlePrimary}
            disabled={primaryBusy}
          >
            {primaryBusy ? 'Submitting…' : primaryLabel}
          </button>
          <button
            className="biz-modal__btn biz-modal__btn--ghost"
            onClick={onDismiss}
          >
            {secondaryLabel}
          </button>
        </div>
      </motion.div>
    </>,
    document.body
  );
}
