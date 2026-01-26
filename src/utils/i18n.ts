export type Language = 'ta' | 'en';

export const languages: Language[] = ['ta', 'en'];

export const defaultLanguage: Language = 'ta';

export interface Translations {
  [key: string]: {
    ta: string;
    en: string;
  };
}

export const translations: Translations = {
  home: {
    ta: 'முகப்பு',
    en: 'Home',
  },
  about: {
    ta: 'எங்களைப் பற்றி',
    en: 'About Us',
  },
  tamilSchool: {
    ta: 'தமிழ்ப் பள்ளி',
    en: 'Tamil School',
  },
  schoolDonation: {
    ta: 'பள்ளி நன்கொடை',
    en: 'School Donation',
  },
  studentRegistration: {
    ta: 'மாணவர் பதிவு',
    en: 'Student Registration',
  },
  publications: {
    ta: 'எங்களின் பதிப்புக்கள்',
    en: 'Publications',
  },
  gallery: {
    ta: 'வண்ணக் களஞ்சியம்',
    en: 'Gallery',
  },
  contact: {
    ta: 'தொடர்பு கொள்ள',
    en: 'Contact',
  },
  address: {
    ta: 'முகவரி',
    en: 'Address',
  },
  email: {
    ta: 'மின்னஞ்சல்',
    en: 'Email',
  },
  phone: {
    ta: 'தொலைபேசி',
    en: 'Phone',
  },
  upcomingEvent: {
    ta: 'எதிர்வரும் நிகழ்வு',
    en: 'Upcoming Event',
  },
  readMore: {
    ta: 'மேலும் படிக்க',
    en: 'Read More',
  },
  learnMore: {
    ta: 'மேலும் அறிய',
    en: 'Learn More',
  },
  getInTouch: {
    ta: 'தொடர்பு கொள்ள',
    en: 'Get in Touch',
  },
};

export function getTranslation(key: keyof typeof translations, lang: Language): string {
  const translation = translations[key]?.[lang] || translations[key]?.[defaultLanguage];
  return translation || String(key);
}
