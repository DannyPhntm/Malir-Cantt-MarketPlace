import { BUSINESS_BENEFITS } from '../data/premiumConfig';
import './BusinessBenefitsCard.css';

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M9 21V9"/>
    </svg>
  );
}

/**
 * Premium info card explaining the benefits of a business account.
 * Reusable: defaults to the shared BUSINESS_BENEFITS list, but accepts a
 * custom title / benefits / note for other contexts (upgrade modal, etc.).
 */
export default function BusinessBenefitsCard({
  title = 'Why go Business?',
  benefits = BUSINESS_BENEFITS,
  note,
}) {
  return (
    <div className="biz-benefits">
      <div className="biz-benefits__head">
        <span className="biz-benefits__icon" aria-hidden="true"><BuildingIcon /></span>
        <p className="biz-benefits__title">{title}</p>
      </div>
      <ul className="biz-benefits__list">
        {benefits.map(benefit => (
          <li key={benefit} className="biz-benefits__item">
            <span className="biz-benefits__check" aria-hidden="true"><CheckIcon /></span>
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
      {note && <p className="biz-benefits__note">{note}</p>}
    </div>
  );
}
