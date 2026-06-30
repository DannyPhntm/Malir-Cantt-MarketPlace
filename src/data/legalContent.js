// Plain-language legal/safety copy for beta. Not a substitute for legal review.
// Each doc renders via LegalPage: sections have a heading + paragraphs (p) and/or
// a bullet list. Keep the tone simple and friendly for everyday users.

const LAST_UPDATED = 'June 2026';

export const LEGAL_DOCS = {
  terms: {
    title: 'Terms of Service',
    subtitle: 'The simple rules for using People of Malir Cantt Bazaar.',
    updated: LAST_UPDATED,
    intro: [
      'People of Malir Cantt Bazaar is a local community marketplace for Malir Cantt residents. These terms explain how it works and what we each expect. The platform is in beta, so some features are still being added and improved.',
      'By using the site you agree to these terms. Please read them — they are short on purpose.',
    ],
    sections: [
      {
        h: 'What this platform is',
        p: [
          'We give residents and local businesses a place to post listings and connect with each other. We are a connector — not a shop, not a courier, and not a party to any deal you make.',
          'Any sale, purchase, hire, payment, or delivery is strictly between the buyer and the seller.',
        ],
      },
      {
        h: 'Your responsibilities',
        p: ['You are responsible for your own listings, messages, pricing, delivery, and deals. Please:'],
        list: [
          'Give accurate, honest information in your listings and profile.',
          'Use real photos and clear descriptions.',
          'Do not post illegal, fake, misleading, harmful, stolen, counterfeit, or otherwise prohibited items or services.',
          'Treat other users with respect.',
        ],
      },
      {
        h: 'Business accounts',
        p: [
          'Business accounts need admin approval. To verify a business is real, we may ask for proof such as a bill, receipt, shop document, business card, address proof, or similar.',
          'Approval is at the admin’s discretion and can be rejected or removed if something does not check out.',
        ],
      },
      {
        h: 'Moderation',
        p: ['To keep the marketplace safe and useful, admins may approve, reject, hide, edit visibility, or remove listings, and may suspend, block, or restrict accounts for safety, spam, fraud, misuse, or rule violations.'],
      },
      {
        h: 'No guarantees',
        p: [
          'We do not guarantee the quality, authenticity, legality, condition, delivery, payment, or outcome of any listing or deal, and we cannot guarantee how any buyer or seller will behave.',
          'Always check carefully before you pay or meet someone.',
        ],
      },
      {
        h: 'Staying safe',
        list: [
          'Meet in safe, public places whenever possible.',
          'Inspect items before you pay.',
          'Be careful with advance payments and never share OTPs.',
          'Do not share unnecessary personal information.',
          'Report suspicious listings or users.',
        ],
      },
      {
        h: 'Payments',
        p: [
          'During beta, the platform does not process any online payments. There is no payment gateway on the website yet.',
          'Any payment between a buyer and seller is handled directly between them. If platform payment features are added later, we will update these terms.',
        ],
      },
      {
        h: 'Limitation of liability',
        p: ['You use the platform at your own risk. To the maximum extent allowed by law, we are not responsible for any loss, dispute, fraud, damage, or failed transaction that happens between users.'],
      },
      {
        h: 'Account restriction',
        p: ['Accounts can be blocked or suspended for misuse, fraud, spam, fake listings, abuse, or breaking these rules. Blocking is reversible — contact support if you believe it was a mistake.'],
      },
      {
        h: 'Changes to these terms',
        p: ['We may update these terms as the marketplace grows. Continued use after an update means you accept the updated terms.'],
      },
    ],
  },

  privacy: {
    title: 'Privacy Policy',
    subtitle: 'What information we collect and how we use it.',
    updated: LAST_UPDATED,
    intro: [
      'This explains what we collect and how we use it, in plain language. We only collect what we need to run the marketplace.',
    ],
    sections: [
      {
        h: 'What we collect',
        list: [
          'Your name and email.',
          'Phone / WhatsApp number, if you provide it.',
          'Your listings and the images you upload.',
          'Business application details and verification documents (if you apply as a business).',
          'Optional CNIC photo or NTN number — only if you choose to provide them.',
          'Messages you send through the contact form.',
          'Basic technical/log data (for security and to keep the site working).',
        ],
      },
      {
        h: 'How we use it',
        list: [
          'Creating your account and signing you in.',
          'Verifying your email.',
          'Showing your listings to other users.',
          'Verifying businesses before approval.',
          'Admin moderation and keeping the marketplace safe.',
          'Responding to support and contact messages.',
          'Security and preventing abuse, spam, and fraud.',
        ],
      },
      {
        h: 'Business verification documents',
        p: [
          'Documents you upload to verify a business (bill, receipt, shop document, CNIC, etc.) are used only for admin verification.',
          'They are never shown publicly, access is limited to admins, and they are stored securely with our cloud image provider.',
        ],
      },
      {
        h: 'Service providers we use',
        p: ['We rely on trusted third-party services to run the platform — for example hosting, database, email, and image storage providers (such as Vercel, Railway, Neon, Resend, and Cloudinary). They process data only to provide their service to us.'],
      },
      {
        h: 'Your choices',
        list: [
          'You can contact support with any account or data questions.',
          'You can ask us to correct or remove your information where reasonable.',
        ],
      },
      {
        h: 'Security',
        p: ['We take reasonable steps to protect your information. However, no online platform can be 100% secure, so please share personal information carefully.'],
      },
    ],
  },

  safety: {
    title: 'Community Guidelines & Safety',
    subtitle: 'How we keep the marketplace trustworthy for everyone.',
    updated: LAST_UPDATED,
    intro: ['A few simple rules keep the bazaar safe and useful for the whole community.'],
    sections: [
      {
        h: 'Be honest',
        list: [
          'No scams or fake listings.',
          'Use accurate photos and descriptions.',
          'List a fair, real price.',
        ],
      },
      {
        h: 'Keep it legal and respectful',
        list: [
          'No illegal, stolen, counterfeit, or prohibited items or services.',
          'No harassment, abuse, or hateful behaviour.',
          'Respect other residents — this is a local community.',
        ],
      },
      {
        h: 'Trade safely',
        list: [
          'Meet in safe, public places where possible.',
          'Inspect items before paying.',
          'Be careful with advance payments; never share OTPs.',
          'Report anything suspicious.',
        ],
      },
      {
        h: 'Moderation',
        p: ['Admins may remove content or restrict accounts that break these guidelines. Reporting suspicious listings or users helps keep everyone safe.'],
      },
    ],
  },
};
