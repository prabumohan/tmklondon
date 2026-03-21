import { useEffect, useState } from 'react';
import { getTranslation } from '../utils/i18n';

export type UpcomingEventItem = {
  date: string;
  title: { ta: string; en: string };
  description: { ta: string; en: string };
  link?: string;
};

const DEFAULT_EVENTS: UpcomingEventItem[] = [
  {
    date: 'Dec 15, 2024',
    title: { ta: 'பொங்கல் கொண்டாட்டம்', en: 'Pongal Celebration' },
    description: {
      ta: 'பாரம்பரிய பொங்கல் விழாவில் எங்களுடன் சேரவும்',
      en: 'Join us for traditional Pongal festivities',
    },
  },
  {
    date: 'Dec 20, 2024',
    title: { ta: 'தமிழ் மொழி பட்டறை', en: 'Tamil Language Workshop' },
    description: {
      ta: 'தமிழ் எழுத்து மற்றும் உரையாடலை கற்றுக்கொள்ளுங்கள்',
      en: 'Learn Tamil script and conversation',
    },
  },
  {
    date: 'Jan 5, 2025',
    title: { ta: 'கலாச்சார நடன நிகழ்ச்சி', en: 'Cultural Dance Performance' },
    description: {
      ta: 'மாணவர்களின் பரதநாட்டியம் நிகழ்ச்சி',
      en: 'Bharatanatyam showcase by students',
    },
  },
];

function normalize(arr: unknown): UpcomingEventItem[] {
  if (!Array.isArray(arr)) return DEFAULT_EVENTS;
  const out: UpcomingEventItem[] = [];
  for (const raw of arr) {
    const item = raw as UpcomingEventItem;
    const title = item?.title || { ta: '', en: '' };
    const description = item?.description || { ta: '', en: '' };
    const date = typeof item?.date === 'string' ? item.date.trim() : '';
    const ta = typeof title.ta === 'string' ? title.ta : '';
    const en = typeof title.en === 'string' ? title.en : '';
    const dta = typeof description.ta === 'string' ? description.ta : '';
    const den = typeof description.en === 'string' ? description.en : '';
    const link = typeof item?.link === 'string' ? item.link.trim() : '';
    if (date && (ta || en) && (dta || den)) {
      out.push({
        date,
        title: { ta, en },
        description: { ta: dta, en: den },
        ...(link ? { link } : {}),
      });
    }
  }
  return out.length > 0 ? out : DEFAULT_EVENTS;
}

export default function UpcomingEventsSection() {
  const [events, setEvents] = useState<UpcomingEventItem[]>(DEFAULT_EVENTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/upcoming-events')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setEvents(normalize(data));
        setLoaded(true);
      })
      .catch(() => {
        setLoaded(true);
      });
  }, []);

  return (
    <section id="activities" className="py-16 md:py-24 theme-section-events">
      <div className="container mx-auto px-4">
        <p className="text-center text-primary font-semibold text-sm uppercase tracking-wide mb-2">
          <span className="i18n-ta">கல்வி மற்றும் சமூகம்</span>
          <span className="i18n-en">Education &amp; Community</span>
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-3 font-tamil text-gray-800">
          <span className="i18n-ta">{getTranslation('upcomingEvent', 'ta')}</span>
          <span className="i18n-en">{getTranslation('upcomingEvent', 'en')}</span>
        </h2>
        <p className="text-center text-gray-600 mb-10 md:mb-14 text-base md:text-lg max-w-2xl mx-auto">
          <span className="i18n-ta block">வரவிருக்கும் நிகழ்வுகளைப் பார்க்கவும்</span>
          <span className="i18n-en block">Check out our upcoming events</span>
        </p>

        <div
          className={`grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-90'}`}
        >
          {events.map((event, index) => (
            <div
              key={`${event.date}-${index}`}
              className="event-card group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-x-hidden border border-gray-100 hover:border-primary-200 flex min-w-0"
            >
              <div
                className="w-1 rounded-l-2xl bg-primary shrink-0 self-stretch opacity-80 group-hover:opacity-100 transition-opacity"
                aria-hidden
              />
              <div className="p-6 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-3">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide shrink-0">
                    <span className="i18n-ta">நிகழ்வு</span>
                    <span className="i18n-en">Event</span>
                  </span>
                  <span className="text-gray-300 shrink-0" aria-hidden>
                    ·
                  </span>
                  <div className="flex items-center gap-2 min-w-0 shrink-0">
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <span className="text-sm text-primary font-semibold break-words">{event.date}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 font-tamil">
                  <span className="i18n-ta">{event.title.ta}</span>
                  <span className="i18n-en">{event.title.en}</span>
                </h3>
                <p className="text-gray-600 mb-4 font-tamil leading-relaxed text-sm">
                  <span className="i18n-ta">{event.description.ta}</span>
                  <span className="i18n-en">{event.description.en}</span>
                </p>
                <a
                  href={event.link && event.link.length > 0 ? event.link : '#activities'}
                  data-preserve-lang
                  className="text-primary hover:text-primary-dark font-semibold inline-flex items-center gap-1 text-sm group/link"
                  {...(event.link && event.link.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  <span className="i18n-ta">மேலும் அறிய</span>
                  <span className="i18n-en">Learn More</span>
                  <svg
                    className="w-4 h-4 group-hover/link:translate-x-0.5 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10 md:mt-14">
          <a
            href="/activities"
            data-preserve-lang
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all shadow-lg hover:shadow-xl"
          >
            <span className="i18n-ta">அனைத்து நிகழ்வுகளையும் பார்க்க</span>
            <span className="i18n-en">View All Events</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
