import { useEffect, useMemo, useState } from 'react';
import type { UpcomingEventItem } from './UpcomingEventsSection';
import { parseEventDisplayDate, formatYmd, compareEventDates } from '../utils/event-date';

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

function buildCalendarCells(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { day: number; inMonth: boolean }[] = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push({ day: 0, inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: 0, inMonth: false });
  }
  while (cells.length < 42) {
    cells.push({ day: 0, inMonth: false });
  }
  return { cells, daysInMonth };
}

export default function EventsCalendarPage() {
  const now = new Date();
  const [events, setEvents] = useState<UpcomingEventItem[]>(DEFAULT_EVENTS);
  const [loaded, setLoaded] = useState(false);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedYmd, setSelectedYmd] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/upcoming-events')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setEvents(normalize(data));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const byYmd = useMemo(() => {
    const map = new Map<string, UpcomingEventItem[]>();
    for (const e of events) {
      const d = parseEventDisplayDate(e.date);
      if (!d) continue;
      const k = formatYmd(d);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    }
    return map;
  }, [events]);

  const unscheduled = useMemo(
    () => events.filter((e) => !parseEventDisplayDate(e.date)),
    [events]
  );

  const sortedWithDates = useMemo(() => {
    return [...events]
      .map((e) => ({ e, d: parseEventDisplayDate(e.date) }))
      .sort((a, b) => compareEventDates(a.d, b.d));
  }, [events]);

  const { cells } = buildCalendarCells(year, month);

  const weekdayLabelsTa = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2023, 0, 1 + i);
    return new Intl.DateTimeFormat('ta-IN', { weekday: 'short' }).format(d);
  });

  const monthLabelEn = new Date(year, month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const monthLabelTa = new Date(year, month, 1).toLocaleDateString('ta-IN', { month: 'long', year: 'numeric' });

  const today = new Date();
  const todayYmd = formatYmd(new Date(today.getFullYear(), today.getMonth(), today.getDate()));

  const goPrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
    setSelectedYmd(null);
  };

  const goNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
    setSelectedYmd(null);
  };

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedYmd(todayYmd);
  };

  const weekdayLabelsEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const selectedEvents = selectedYmd ? byYmd.get(selectedYmd) ?? [] : [];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-tamil">
              <span className="i18n-ta">{monthLabelTa}</span>
              <span className="i18n-en">{monthLabelEn}</span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              <span className="i18n-ta">நிகழ்வு உள்ள நாளைத் தட்டவும்</span>
              <span className="i18n-en">Tap a date with a dot to see events</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 min-h-[44px]"
              aria-label="Previous month"
            >
              ←
            </button>
            <button type="button" onClick={goToday} className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:opacity-95 min-h-[44px]">
              <span className="i18n-ta">இன்று</span>
              <span className="i18n-en">Today</span>
            </button>
            <button
              type="button"
              onClick={goNext}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 min-h-[44px]"
              aria-label="Next month"
            >
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px sm:gap-1 mb-2 text-center text-xs sm:text-sm font-semibold text-gray-600">
          {weekdayLabelsEn.map((en, i) => (
            <div key={en} className="py-2">
              <span className="i18n-ta block font-tamil">{weekdayLabelsTa[i]}</span>
              <span className="i18n-en block">{en}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px sm:gap-1">
          {cells.map((cell, idx) => {
            if (!cell.inMonth) {
              return (
                <div
                  key={`pad-${idx}`}
                  className="min-h-[3rem] sm:min-h-[4rem] rounded-lg bg-gray-50/80 border border-transparent"
                />
              );
            }
            const d = new Date(year, month, cell.day);
            const ymd = formatYmd(d);
            const dayEvents = byYmd.get(ymd) ?? [];
            const hasEvents = dayEvents.length > 0;
            const isToday = ymd === todayYmd;
            const isSelected = selectedYmd === ymd;

            return (
              <button
                key={ymd}
                type="button"
                onClick={() => setSelectedYmd(hasEvents ? (selectedYmd === ymd ? null : ymd) : null)}
                disabled={!hasEvents}
                className={`min-h-[3rem] sm:min-h-[4rem] rounded-lg border text-sm sm:text-base font-medium transition-colors flex flex-col items-center justify-center gap-0.5 p-1
                  ${!hasEvents ? 'border-gray-100 text-gray-400 cursor-default' : 'border-primary/30 text-gray-900 hover:bg-primary/5 cursor-pointer'}
                  ${isToday ? 'ring-2 ring-primary/40' : ''}
                  ${isSelected && hasEvents ? 'bg-primary/15 border-primary ring-2 ring-primary' : 'bg-white'}
                `}
              >
                <span>{cell.day}</span>
                {hasEvents && (
                  <span className="flex gap-0.5 justify-center" aria-hidden>
                    {dayEvents.slice(0, 3).map((_, i) => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary" />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selectedYmd && selectedEvents.length > 0 && (
          <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-sm font-semibold text-primary mb-3">
              <span className="i18n-ta">தேர்ந்தெடுக்கப்பட்ட நாள்</span>
              <span className="i18n-en">Selected date</span>
              <span className="text-gray-800 ml-2">{selectedYmd}</span>
            </p>
            <ul className="space-y-3">
              {selectedEvents.map((ev, i) => (
                <li key={i} className="border-b border-gray-200 last:border-0 pb-3 last:pb-0">
                  <h3 className="font-tamil font-bold text-gray-900">
                    <span className="i18n-ta">{ev.title.ta}</span>
                    <span className="i18n-en">{ev.title.en}</span>
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 font-tamil">
                    <span className="i18n-ta">{ev.description.ta}</span>
                    <span className="i18n-en">{ev.description.en}</span>
                  </p>
                  {ev.link ? (
                    <a
                      href={ev.link}
                      data-preserve-lang
                      className="inline-block mt-2 text-sm font-semibold text-primary hover:underline"
                      {...(ev.link.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      <span className="i18n-ta">மேலும் அறிய</span>
                      <span className="i18n-en">Learn more</span>
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 font-tamil text-center">
          <span className="i18n-ta">அனைத்து நிகழ்வுகளும்</span>
          <span className="i18n-en">All events</span>
        </h2>
        {!loaded && (
          <p className="text-center text-gray-500 text-sm">
            <span className="i18n-ta">ஏற்றுகிறது…</span>
            <span className="i18n-en">Loading…</span>
          </p>
        )}
        <ul className="space-y-4">
          {sortedWithDates.map(({ e, d }, idx) => (
            <li
              key={idx}
              className="bg-white rounded-xl shadow border border-gray-100 p-5 flex flex-col sm:flex-row sm:items-start gap-3"
            >
              <div className="shrink-0 w-full sm:w-36 text-center sm:text-left">
                <div className="inline-flex sm:flex flex-col items-center sm:items-start gap-1 px-3 py-2 rounded-lg bg-primary/10 text-primary">
                  <span className="text-xs font-bold uppercase tracking-wide">
                    <span className="i18n-ta">நாள்</span>
                    <span className="i18n-en">Date</span>
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{e.date}</span>
                </div>
                {!d && (
                  <p className="text-xs text-amber-700 mt-0.5">
                    <span className="i18n-ta">நாள்காட்டியில் இணைக்க முடியாதது</span>
                    <span className="i18n-en">Not placed on calendar — use a date like &quot;15 Mar 2026&quot;</span>
                  </p>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 font-tamil">
                  <span className="i18n-ta">{e.title.ta}</span>
                  <span className="i18n-en">{e.title.en}</span>
                </h3>
                <p className="text-gray-600 text-sm mt-2 font-tamil leading-relaxed">
                  <span className="i18n-ta">{e.description.ta}</span>
                  <span className="i18n-en">{e.description.en}</span>
                </p>
                {e.link ? (
                  <a
                    href={e.link}
                    data-preserve-lang
                    className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-primary hover:underline"
                    {...(e.link.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    <span className="i18n-ta">மேலும் அறிய</span>
                    <span className="i18n-en">Learn more</span>
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        {unscheduled.length > 0 && (
          <p className="text-sm text-gray-500 mt-6 text-center">
            <span className="i18n-ta">சில நிகழ்வுகள் நாள்காட்டியில் காட்டப்படவில்லை — தேதியை ஆங்கில வடிவத்தில் (எ.கா. 15 Mar 2026) உள்ளிடவும்.</span>
            <span className="i18n-en">
              Some items may not appear on the grid — use an English-style date in admin (e.g. 15 Mar 2026) so we can parse them.
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
