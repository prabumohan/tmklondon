import type { SEOProps } from 'astro-seo';

export const siteConfig = {
  /** Primary title for search: "London Tamil Sangam" first for Google ranking */
  title: 'London Tamil Sangam | TMK London - Tamil School & Community Since 1975',
  description: 'London Tamil Sangam (TMK London) – Tamil community and Tamil school in London, UK since 1975. Join the London Tamil Sangam for Tamil language classes, culture events, and Tamil sangam activities. Tamil Sangam London, Tamil society London, East London Tamil.',
  url: 'https://tmklondon.com',
  defaultLocale: 'ta',
  locales: ['ta', 'en'],
  keywords: 'London Tamil Sangam, Tamil Sangam London, London Tamil Sangam UK, Tamil sangam, Tamil community London, TMK London, Thamizhar Munnetra Kazhagam London, Tamil school London, Tamil language classes London, Tamil society UK, Tamil cultural centre London, learn Tamil London, Tamil school East London, Manor Park Tamil, Tamil Sangam',
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
    alternateName: ['TMK London', 'Thamizhar Munnetra Kazhagam London', 'Tamil Sangam London', 'TMK Tamil School', 'London Tamil Sangam UK'],
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
    sameAs: [
      siteConfig.social.facebook,
      siteConfig.social.instagram,
      siteConfig.social.youtube,
    ],
  };
}

/** LocalBusiness schema for "London Tamil Sangam" local search (Google Maps, local pack) */
export function getLocalBusinessSchemaForSEO() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'London Tamil Sangam',
    alternateName: ['TMK London', 'Tamil Sangam London', 'London Tamil Sangam UK'],
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
    alternateName: ['TMK Tamil School', 'London Tamil Sangam Tamil School', 'Tamil School London'],
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
