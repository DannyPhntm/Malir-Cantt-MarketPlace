import { BADGE_TYPE } from '../data/premiumConfig';
import './VerifiedBadge.css';

function CheckIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M2 7l10 7 10-7"/>
    </svg>
  );
}

// Each badge kind → its icon + default label. Centralised so callers only pass a `type`.
const BADGE_CONFIG = {
  [BADGE_TYPE.EMAIL]:    { Icon: MailIcon,   label: 'Email Verified' },
  [BADGE_TYPE.RESIDENT]: { Icon: CheckIcon,  label: 'Verified Resident' },
  [BADGE_TYPE.BUSINESS]: { Icon: ShieldIcon, label: 'Verified Business' },
};

// type: 'email' | 'resident' | 'business'
// size: 'sm' (default, for cards) | 'md' (for detail/profile contexts)
// label: optional override for the default text
export default function VerifiedBadge({ type = BADGE_TYPE.RESIDENT, size = 'sm', label }) {
  const config = BADGE_CONFIG[type] || BADGE_CONFIG[BADGE_TYPE.RESIDENT];
  const { Icon } = config;
  const text = label || config.label;
  return (
    <span className={`verified-badge verified-badge--${size} verified-badge--${type}`} title={text}>
      <Icon />
      {text}
    </span>
  );
}
