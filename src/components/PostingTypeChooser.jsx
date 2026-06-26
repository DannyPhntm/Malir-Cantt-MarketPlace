import './PostingTypeChooser.css';

/**
 * Personal vs Business listing chooser — shown for every category on Add Listing.
 * Frames the choice as posting personally vs commercially (NOT free vs paid).
 *
 * Props:
 *  - value: 'personal' | 'business'
 *  - onChange(next): set the posting type
 *  - businessOnly: category is commercial-only (locks to business)
 *  - isApprovedBusiness: caller has an active Business Seller account
 *  - needsApproval: business chosen but not approved → show CTA
 *  - onApply(): open the business-account application flow
 */
export default function PostingTypeChooser({ value, onChange, businessOnly, isApprovedBusiness, needsApproval, onApply }) {
  const pick = (next) => {
    if (businessOnly && next === 'personal') return; // commercial category — personal not allowed
    onChange(next);
  };

  return (
    <div className="ptype">
      <h2 className="ptype__title">Choose how you want to post</h2>

      <div className="ptype__grid" role="radiogroup" aria-label="Posting type">
        <button
          type="button"
          role="radio"
          aria-checked={value === 'personal'}
          className={`ptype__card${value === 'personal' ? ' ptype__card--active' : ''}${businessOnly ? ' ptype__card--disabled' : ''}`}
          onClick={() => pick('personal')}
          disabled={businessOnly}
        >
          <span className="ptype__card-head">
            <span className="ptype__radio" aria-hidden="true" />
            <span className="ptype__card-name">Personal Listing</span>
          </span>
          <span className="ptype__card-desc">
            For Malir Cantt residents selling personal items or posting one-time needs. Best for used
            items, personal cars, furniture, property by owner, or household help requests. Personal
            listings are free and do not include business branding.
          </span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={value === 'business'}
          className={`ptype__card${value === 'business' ? ' ptype__card--active' : ''}`}
          onClick={() => pick('business')}
        >
          <span className="ptype__card-head">
            <span className="ptype__radio" aria-hidden="true" />
            <span className="ptype__card-name">Business Listing</span>
          </span>
          <span className="ptype__card-desc">
            For shops, services, restaurants, gyms, academies, agencies, dealerships, and companies
            promoting commercial offers, jobs, products, or services. Business listings require an
            approved business account and can show your verified business badge, shop name, logo,
            WhatsApp/contact button, and link to your shop profile.
          </span>
        </button>
      </div>

      {businessOnly && (
        <p className="ptype__hint">This is a commercial category, so listings here are posted as a Business Listing.</p>
      )}

      {value === 'business' && needsApproval && !isApprovedBusiness && (
        <div className="ptype__cta">
          <p>Business Listings need an approved business account.</p>
          <button type="button" className="ptype__cta-btn" onClick={onApply}>Apply for a business account</button>
        </div>
      )}

      <p className="ptype__note">
        Business features are free during beta. Featured placement and premium business visibility may
        become paid after beta.
      </p>
      <p className="ptype__note ptype__note--warn">
        Commercial posts submitted as personal listings may be hidden or moved to business review.
      </p>
    </div>
  );
}
