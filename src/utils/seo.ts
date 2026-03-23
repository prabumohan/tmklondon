import type { SEOProps } from 'astro-seo';

export const siteConfig = {
  /** Lead with "London Tamil" / org name — first ~60 chars matter most in SERPs */
  title: 'London Tamil Sangam | TMK London – Tamil School & Community Since 1975',
  description:
    'London Tamil community & Tamil school in Manor Park, East London since 1975. TMK London (Thamizhar Munnetra Kazhagam), also known as Thiruvalluvar Tamil School: Tamil classes, culture events & Tamil sangam activities. Tamil London · Tamil UK · learn Tamil in London.',
  url: 'https://tmklondon.com',
  defaultLocale: 'ta',
  locales: ['ta', 'en'],
  keywords:
    'TMK, TMK London, Tamil, Tamil school, Tamil School London, london Tamil, Tamil community, Tamil community London, Tamil kazhagam, Thamizhar Munnetra Kazhagam, London Tamil, London Tamil Sangam, Tamil London, Tamil UK, Tamil classes London, Tamil Sangam London, Thiruvalluvar Tamil School, Thiruvalluvar Tamil School London, Tamil language London, East London Tamil, Manor Park Tamil, Tamil society UK, Tamil cultural events London, learn Tamil London, Tamil sangam UK',
  contact: {
    email: 'tmktamilschool@gmail.com',
    phone: '+447459528739',
    address: {
      street: '46A East Avenue',
      area: 'Manor Park',
      city: 'London',
      postcode: 'E12 6SQ',
      country: 'United Kingdom',
    },
  },
  social: {
    facebook: 'https://www.facebook.com/tmktamilschool/',
    instagram: 'https://www.instagram.com/tmk.london?igsh=MWJ5Z2Yzem9oYzk1cg==',
    youtube: 'https://youtube.com/@tmklondon?si=8q3gtTDP-KnIszs5',
    whatsapp: '+447459528739', // links use https://wa.me/447459528739
  },
};

export function getSEOConfig(
  pageTitle?: string,
  description?: string,
  image?: string,
  keywords?: string,
  canonicalUrl?: string
): SEOProps {
  const title = pageTitle && pageTitle.trim() ? `${pageTitle} | ${siteConfig.title}` : siteConfig.title;
  const defaultImage = image || `${siteConfig.url}/logo.png`;
  const metaKeywords = keywords || siteConfig.keywords;
  const canonical = canonicalUrl || siteConfig.url;

  return {
    title,
    description: description || siteConfig.description,
    canonical,
    openGraph: {
      basic: {
        title,
        type: 'website',
        image: defaultImage,
        url: canonical,
      },
      optional: {
        locale: 'en_GB',
        siteName: siteConfig.title,
        description: description || siteConfig.description,
      },
      image: {
        url: defaultImage,
        alt: pageTitle || siteConfig.title,
      },
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description || siteConfig.description,
      image: defaultImage,
    },
    extend: {
      meta: [
        {
          name: 'keywords',
          content: metaKeywords,
        },
        {
          name: 'author',
          content: 'London Tamil Sangam - TMK London',
        },
        {
      name: 'geo.region',
          content: 'GB-LND',
        },
        {
          name: 'geo.placename',
          content: 'London, UK',
        },
      ],
    },
  };
}

export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'London Tamil Sangam',
    alternateName: ['TMK London', 'Thamizhar Munnetra Kazhagam London', 'Tamil Sangam London', 'TMK Tamil School', 'Thiruvalluvar Tamil School', 'London Tamil Sangam UK'],
    description: siteConfig.description,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: siteConfig.contact.phone,
      contactType: 'Customer Service',
      email: siteConfig.contact.email,
      areaServed: 'GB',
      availableLanguage: ['Tamil', 'English'],
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.contact.address.street,
      addressLocality: siteConfig.contact.address.area,
      addressRegion: siteConfig.contact.address.city,
      postalCode: siteConfig.contact.address.postcode,
      addressCountry: 'GB',
    },
    foundingDate: '1975',
    knowsAbout: [
      'Tamil language',
      'Tamil culture',
      'London Tamil community',
      'Tamil school UK',
    ],
    sameAs: [
      siteConfig.social.facebook,
      siteConfig.social.instagram,
      siteConfig.social.youtube,
    ],
  };
}

/** WebSite JSON-LD — ties the domain to the org (helps Google understand the brand entity). */
export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteConfig.url}/#website`,
    name: 'London Tamil Sangam | TMK London',
    alternateName: [
      'TMK London',
      'Thamizhar Munnetra Kazhagam London',
      'London Tamil community',
      'Tamil Sangam London',
      'Thiruvalluvar Tamil School London',
    ],
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: ['ta', 'en'],
    publisher: {
      '@type': 'Organization',
      name: 'London Tamil Sangam',
      url: siteConfig.url,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/logo.png`,
      },
    },
  };
}

/** FAQ rich results — answers real “London Tamil / Tamil school” queries (no keyword stuffing). */
export function getHomepageFAQSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is London Tamil Sangam (TMK London)?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'London Tamil Sangam — Thamizhar Munnetra Kazhagam (TMK London) — is a Tamil community and education organisation in Manor Park, East London, established in 1975. We promote Tamil language, literature and culture through classes, events and community activities.',
        },
      },
      {
        '@type': 'Question',
        name: 'Where can I learn Tamil in London?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'TMK London runs Tamil language classes and a Tamil school programme for children and families in East London (Manor Park). See the Tamil School pages on tmklondon.com for registration and term dates.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is TMK London a registered Tamil community organisation?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. TMK London (London Tamil Sangam) is a long-standing Tamil community and education charity serving London since 1975, with contact details and activities listed on this official website.',
        },
      },
    ],
  };
}

/** LocalBusiness schema for "London Tamil Sangam" local search (Google Maps, local pack) */
export function getLocalBusinessSchemaForSEO() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'London Tamil Sangam',
    alternateName: ['TMK London', 'Tamil Sangam London', 'Thiruvalluvar Tamil School', 'London Tamil Sangam UK'],
    description: siteConfig.description,
    url: siteConfig.url,
    image: `${siteConfig.url}/logo.png`,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.contact.address.street,
      addressLocality: siteConfig.contact.address.area,
      addressRegion: siteConfig.contact.address.city,
      postalCode: siteConfig.contact.address.postcode,
      addressCountry: 'GB',
    },
    geo: {
      '@type': 'GeoCoordinates',
      addressLocality: siteConfig.contact.address.area,
      addressRegion: siteConfig.contact.address.city,
      addressCountry: 'GB',
    },
    sameAs: [
      siteConfig.social.facebook,
      siteConfig.social.instagram,
      siteConfig.social.youtube,
    ],
  };
}

export function getLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'London Tamil Sangam - TMK Tamil School',
    alternateName: ['TMK Tamil School', 'London Tamil Sangam Tamil School', 'Thiruvalluvar Tamil School', 'Tamil School London'],
    description: 'Tamil language and culture school run by London Tamil Sangam (TMK London) in East London since 1975. Tamil classes, Tamil sangam events, and community activities.',
    url: `${siteConfig.url}/tamil-school`,
    image: `${siteConfig.url}/logo.png`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.contact.address.street,
      addressLocality: siteConfig.contact.address.area,
      addressRegion: siteConfig.contact.address.city,
      postalCode: siteConfig.contact.address.postcode,
      addressCountry: 'GB',
    },
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
  };
}
