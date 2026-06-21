import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './Lightbox.css';

export default function Lightbox({ images, initialIndex = 0, onClose }) {
  const [current, setCurrent] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const stageRef = useRef(null);

  const prev = useCallback(() => {
    setCurrent(i => (i - 1 + images.length) % images.length);
    setZoom(1);
  }, [images.length]);

  const next = useCallback(() => {
    setCurrent(i => (i + 1) % images.length);
    setZoom(1);
  }, [images.length]);

  const zoomIn  = useCallback(() => setZoom(z => Math.min(+(z + 0.5).toFixed(1), 4)), []);
  const zoomOut = useCallback(() => setZoom(z => Math.max(+(z - 0.5).toFixed(1), 1)), []);
  const zoomReset = () => setZoom(1);

  // Keyboard shortcuts
  useEffect(() => {
    const handle = (e) => {
      if (e.key === 'ArrowLeft')             prev();
      else if (e.key === 'ArrowRight')       next();
      else if (e.key === 'Escape')           onClose();
      else if (e.key === '+' || e.key === '=') zoomIn();
      else if (e.key === '-')                zoomOut();
      else if (e.key === '0')                zoomReset();
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [prev, next, onClose, zoomIn, zoomOut]);

  // Scroll-wheel zoom (passive: false required to preventDefault)
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const handle = (e) => {
      e.preventDefault();
      const step = e.deltaY > 0 ? -0.25 : 0.25;
      setZoom(z => Math.min(Math.max(+(z + step).toFixed(2), 1), 4));
    };
    stage.addEventListener('wheel', handle, { passive: false });
    return () => stage.removeEventListener('wheel', handle);
  }, []);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const hasMany = images.length > 1;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="lightbox"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Image viewer"
      >
        {/* Top bar */}
        <div className="lightbox__top" onClick={e => e.stopPropagation()}>
          {hasMany && (
            <span className="lightbox__counter">{current + 1} / {images.length}</span>
          )}
          <div className="lightbox__zoom-controls">
            <button className="lightbox__icon-btn" onClick={zoomOut} disabled={zoom <= 1} aria-label="Zoom out">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
            <button
              className="lightbox__zoom-level"
              onClick={zoomReset}
              aria-label="Reset zoom"
              title="Click to reset"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button className="lightbox__icon-btn" onClick={zoomIn} disabled={zoom >= 4} aria-label="Zoom in">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="11" y1="8" x2="11" y2="14"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
          </div>
          <button className="lightbox__close" onClick={onClose} aria-label="Close image viewer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Stage */}
        <div
          className="lightbox__stage"
          ref={stageRef}
          onClick={e => e.stopPropagation()}
          style={{ cursor: zoom > 1 ? 'zoom-out' : 'zoom-in' }}
          onDoubleClick={zoom === 1 ? zoomIn : zoomReset}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current}
              className="lightbox__img-wrap"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.img
                src={images[current]}
                alt={`Photo ${current + 1} of ${images.length}`}
                className="lightbox__img"
                animate={{ scale: zoom }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Prev / Next arrows */}
        {hasMany && (
          <>
            <button
              className="lightbox__nav lightbox__nav--prev"
              onClick={e => { e.stopPropagation(); prev(); }}
              aria-label="Previous image"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <button
              className="lightbox__nav lightbox__nav--next"
              onClick={e => { e.stopPropagation(); next(); }}
              aria-label="Next image"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </>
        )}

        {/* Thumbnail strip */}
        {hasMany && (
          <div className="lightbox__thumbs" onClick={e => e.stopPropagation()}>
            {images.map((src, i) => (
              <button
                key={i}
                className={`lightbox__thumb${i === current ? ' lightbox__thumb--active' : ''}`}
                onClick={() => { setCurrent(i); setZoom(1); }}
                aria-label={`View photo ${i + 1}`}
                aria-pressed={i === current}
              >
                <img src={src} alt="" draggable={false} />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
