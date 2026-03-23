import { useEffect, useState } from 'react';

export type PublicationListItem = {
  id: string;
  publisher: string;
  publisherNoteTa: string;
  publisherNoteEn: string;
  titleTa: string;
  titleEn: string;
  href: string;
  ctaTa: string;
  ctaEn: string;
  coverKey?: string | null;
  thumbnailAltTa?: string;
  thumbnailAltEn?: string;
  /** Built-in fallback only: local file URL from Astro */
  thumbnailSrc?: string | null;
};

function r2CoverUrl(coverKey: string): string {
  return '/api/publications/image/' + coverKey.split('/').map(encodeURIComponent).join('/');
}

function normalizeFromApi(raw: Record<string, unknown>): PublicationListItem {
  const id = String(raw.id || '').trim() || `row-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    publisher: String(raw.publisher || ''),
    publisherNoteTa: String(raw.publisherNoteTa || ''),
    publisherNoteEn: String(raw.publisherNoteEn || ''),
    titleTa: String(raw.titleTa || ''),
    titleEn: String(raw.titleEn || ''),
    href: String(raw.href || '#'),
    ctaTa: String(raw.ctaTa || 'பார்க்க'),
    ctaEn: String(raw.ctaEn || 'View'),
    coverKey: raw.coverKey ? String(raw.coverKey) : null,
    thumbnailAltTa: String(raw.thumbnailAltTa || ''),
    thumbnailAltEn: String(raw.thumbnailAltEn || ''),
  };
}

type Props = { fallbackPublications: PublicationListItem[] };

export default function PublicationsSection({ fallbackPublications }: Props) {
  const [items, setItems] = useState<PublicationListItem[]>(fallbackPublications);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/publications/list');
        if (!res.ok) throw new Error('list failed');
        const data = await res.json();
        const raw = Array.isArray(data.items) ? data.items : [];
        const parsed = raw.map((r: Record<string, unknown>) => normalizeFromApi(r));
        if (!cancelled) {
          setItems(parsed.length > 0 ? parsed : fallbackPublications);
          setLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setItems(fallbackPublications);
          setLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fallbackPublications]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
      <h2 className="text-2xl font-bold mb-6 font-tamil text-primary-800 border-b border-primary-100 pb-3">
        <span className="i18n-ta">வெளியீட்டாளர்கள்</span>
        <span className="i18n-en">Publishers</span>
      </h2>
      {!loaded && (
        <p className="text-sm text-gray-500 mb-4" aria-live="polite">
          <span className="i18n-ta">பட்டியலை ஏற்றுகிறது…</span>
          <span className="i18n-en">Loading publications…</span>
        </p>
      )}
      <ul className="space-y-6">
        {items.map((pub) => {
          const thumbFromR2 = pub.coverKey ? r2CoverUrl(pub.coverKey) : null;
          const thumbSrc = thumbFromR2 || pub.thumbnailSrc || null;
          const altEn = pub.thumbnailAltEn || pub.titleEn || 'Publication';
          return (
            <li key={pub.id}>
              <article className="rounded-xl border border-gray-200 p-6 hover:border-primary-200 hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="shrink-0 mx-auto sm:mx-0 w-44 sm:w-48 md:w-52">
                    {thumbSrc ? (
                      <a
                        href={pub.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg overflow-hidden ring-1 ring-gray-200 shadow-sm hover:ring-primary-300 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        title={pub.titleEn}
                      >
                        <img
                          src={thumbSrc}
                          alt={altEn}
                          className="w-full aspect-[2/3] object-cover object-top bg-gray-100"
                          width={416}
                          height={624}
                          loading="lazy"
                          decoding="async"
                        />
                      </a>
                    ) : (
                      <div
                        className="flex aspect-[2/3] w-full flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gradient-to-br from-primary-50 to-gray-100 px-3 text-center text-xs text-gray-500"
                        aria-hidden="true"
                      >
                        <svg
                          className="mb-2 h-10 w-10 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                        <span className="i18n-ta font-tamil leading-snug">முன்பக்கப் படம் இன்னும் இல்லை</span>
                        <span className="i18n-en leading-snug">No cover image yet</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col justify-center text-center sm:text-left">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{pub.publisher}</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      <span className="i18n-ta">{pub.publisherNoteTa}</span>
                      <span className="i18n-en">{pub.publisherNoteEn}</span>
                    </p>
                    <p className="text-gray-800 font-medium mb-4 font-tamil">
                      <span className="i18n-ta">{pub.titleTa}</span>
                      <span className="i18n-en">{pub.titleEn}</span>
                    </p>
                    <div>
                      <a
                        href={pub.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
                      >
                        <span className="i18n-ta">{pub.ctaTa}</span>
                        <span className="i18n-en">{pub.ctaEn}</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
