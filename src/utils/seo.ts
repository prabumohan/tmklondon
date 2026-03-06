import type { SEOProps } from 'astro-seo';

export const siteConfig = {
  title: 'TMK London - Thamizhar Munnetra Kazhagam',
  description: 'TMK Tamil School London - Learn Tamil language and culture in London, UK. Best Tamil school for children and adults. Tamil language classes, Tamil education, Tamil cultural programs.',
  url: 'https://tmklondon.com',
  defaultLocale: 'ta',
  locales: ['ta', 'en'],
  keywords: 'Tamil school, Tamil school London, Tamil language classes, Tamil education UK, Tamil school near me, learn Tamil London, Tamil classes for kids, Tamil cultural center, TMK Tamil School, Tamil school East London',
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
    facebook: 'https://facebook.com/tmklondon',
    instagram: 'https://instagram.com/tmklondon',
    youtube: 'https://youtube.com/tmklondon',
    whatsapp: '+447459528739',
  },
};

export function getSEOConfig(pageTitle?: string, description?: string, image?: string, keywords?: string): SEOProps {
  const title = pageTitle ? `${pageTitle} | ${siteConfig.title}` : siteConfig.title;
  const defaultImage = image || `${siteConfig.url}/logo.png`;
  const metaKeywords = keywords || siteConfig.keywords;
  
  return {
    title,
    description: description || siteConfig.description,
    canonical: siteConfig.url,
    openGraph: {
      basic: {
        title,
        type: 'website',
        image: defaultImage,
        url: siteConfig.url,
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
          content: 'TMK London',
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
    name: 'Thamizhar Munnetra Kazhagam (TMK) London',
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
    name: 'TMK Tamil School',
    url: `${siteConfig.url}/tamil-school`,
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
