import { motion } from 'framer-motion';
import './CategoryFields.css';

const ChevronIcon = () => (
  <svg className="form-select-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function CategoryFields({ config, values, errors, onChange }) {
  if (!config) return null;

  return (
    <motion.div
      className="form-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="form-card__heading">{config.label} Details</h2>

      <div className="catfields__grid">
        {config.fields.map(field => (
          <div
            key={field.name}
            className={`form-group${field.col === 2 ? ' catfields__full' : ''}`}
          >
            <label htmlFor={`cf-${field.name}`} className="form-label">
              {field.label}
              {field.required && (
                <span className="form-required" aria-label="required"> *</span>
              )}
            </label>

            {field.type === 'select' ? (
              <div className="form-select-wrap">
                <select
                  id={`cf-${field.name}`}
                  name={field.name}
                  value={values[field.name] || ''}
                  onChange={onChange}
                  className={`form-select${errors?.[field.name] ? ' form-select--error' : ''}`}
                >
                  <option value="">Select…</option>
                  {field.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <ChevronIcon />
              </div>
            ) : (
              <input
                id={`cf-${field.name}`}
                name={field.name}
                type={field.type || 'text'}
                value={values[field.name] || ''}
                onChange={onChange}
                placeholder={field.placeholder || ''}
                className={`form-input${errors?.[field.name] ? ' form-input--error' : ''}`}
              />
            )}

            {errors?.[field.name] && (
              <p className="form-error" role="alert">{errors[field.name]}</p>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
