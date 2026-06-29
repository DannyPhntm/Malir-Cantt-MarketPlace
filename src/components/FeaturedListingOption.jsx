import { AnimatePresence, motion } from 'framer-motion';
import { LISTING_TIER, FEATURED_BENEFITS } from '../data/premiumConfig';
import './FeaturedListingOption.css';

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

/**
 * Lets a user choose Standard vs Featured when posting a listing.
 *
 * Featured is a *request* only — it never activates featured status here.
 * The selection is reported via onChange(tier); approval happens later in an
 * admin flow. Reusable wherever a listing tier needs to be picked.
 */
export default function FeaturedListingOption({ value, onChange, benefits = FEATURED_BENEFITS }) {
  const isFeatured = value === LISTING_TIER.FEATURED;

  return (
    <div className="form-card">
      <h2 className="form-card__heading">Listing Visibility</h2>
      <p className="form-helper form-helper--spaced">
        Choose how your listing is promoted across the marketplace.
      </p>

      <div className="feat-option-grid" role="radiogroup" aria-label="Listing visibility">
        <label className={`feat-option${!isFeatured ? ' feat-option--active' : ''}`}>
          <input
            type="radio"
            name="listingTier"
            value={LISTING_TIER.STANDARD}
            checked={!isFeatured}
            onChange={() => onChange(LISTING_TIER.STANDARD)}
            className="feat-option__radio"
          />
          <span className="feat-option__title">Standard Listing</span>
          <span className="feat-option__desc">Free — appears in normal browsing and search.</span>
        </label>

        <label className={`feat-option feat-option--featured${isFeatured ? ' feat-option--active' : ''}`}>
          <input
            type="radio"
            name="listingTier"
            value={LISTING_TIER.FEATURED}
            checked={isFeatured}
            onChange={() => onChange(LISTING_TIER.FEATURED)}
            className="feat-option__radio"
          />
          <span className="feat-option__title">
            <span className="feat-option__star" aria-hidden="true"><StarIcon /></span>
            Featured Listing
          </span>
          <span className="feat-option__desc">Get your listing seen by more residents.</span>
        </label>
      </div>

      <AnimatePresence initial={false}>
        {isFeatured && (
          <motion.div
            key="feat-benefits"
            className="feat-benefits"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <ul className="feat-benefits__list">
              {benefits.map(benefit => (
                <li key={benefit} className="feat-benefits__item">
                  <span className="feat-benefits__check" aria-hidden="true"><CheckIcon /></span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            <p className="feat-benefits__note">
              Featured listings will be a paid option after beta. During beta, selected
              featured listings may be approved for free. Your request will be reviewed
              before going live.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
