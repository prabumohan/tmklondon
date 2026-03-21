import { useState, useEffect } from 'react';

export type UpcomingEventItem = {
  date: string;
  title: { ta: string; en: string };
  description: { ta: string; en: string };
  link?: string;
};

const API_KEY_STORAGE = 'tmkAdminApiKey';

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

const emptyDraft = (): UpcomingEventItem => ({
  date: '',
  title: { ta: '', en: '' },
  description: { ta: '', en: '' },
  link: '',
});

export default function AdminUpcomingEvents() {
  const [events, setEvents] = useState<UpcomingEventItem[]>([]);
  const [draft, setDraft] = useState<UpcomingEventItem>(emptyDraft());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<UpcomingEventItem>(emptyDraft());
  const [message, setMessage] = useState({ type: '', text: '' });
  const [apiKey, setApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('adminLoggedIn') !== 'true') {
      window.location.href = '/admin/login';
      return;
    }
    if (typeof window !== 'undefined') {
      setApiKey(localStorage.getItem(API_KEY_STORAGE) || '');
    }
    loadEvents();
  }, []);

  const loadEvents = () => {
    if (typeof window === 'undefined') return;
    fetch('/api/upcoming-events')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const list = normalize(data);
        setEvents(list);
        localStorage.setItem('upcomingEventsItems', JSON.stringify(list));
      })
      .catch(() => {
        const stored = localStorage.getItem('upcomingEventsItems');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setEvents(normalize(parsed));
            return;
          } catch (_) {
            /* ignore */
          }
        }
        setEvents(DEFAULT_EVENTS);
      });
  };

  const saveEvents = async (items: UpcomingEventItem[]) => {
    if (typeof window === 'undefined') return;
    const key = localStorage.getItem(API_KEY_STORAGE);
    const trySave = async (headers: Record<string, string>) => {
      return fetch('/api/upcoming-events', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(items),
      });
    };

    try {
      let res = await trySave({});
      if (res.status === 401 && key) {
        res = await trySave({ 'X-Admin-Key': key });
      }
      if (res.ok) {
        localStorage.setItem('upcomingEventsItems', JSON.stringify(items));
        setEvents(items);
        showMessage('success', '💾 Saved to live site (KV). Homepage will show these events.');
        window.dispatchEvent(new CustomEvent('upcomingEventsUpdated'));
        return;
      }
      const err = await res.json().catch(() => ({}));
      showMessage(
        'error',
        err?.error === 'Unauthorized'
          ? 'Session expired or not authorized. Log in again at /admin/login, or use the API key below.'
          : err?.error || `Save failed (${res.status}).`
      );
    } catch (_) {
      showMessage('error', 'Network error. Save to site failed.');
    }

    localStorage.setItem('upcomingEventsItems', JSON.stringify(items));
    setEvents(items);
    showMessage('success', '💾 Saved locally (this browser only). Log in or set API key to update the live site.');
    window.dispatchEvent(new CustomEvent('upcomingEventsUpdated'));
  };

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const saveApiKey = () => {
    const val = apiKeyInput.trim();
    if (val) {
      localStorage.setItem(API_KEY_STORAGE, val);
      setApiKey(val);
      setApiKeyInput('');
      showMessage('success', 'API key saved.');
    }
  };

  const clearApiKey = () => {
    localStorage.removeItem(API_KEY_STORAGE);
    setApiKey('');
    setApiKeyInput('');
    showMessage('success', 'API key cleared.');
  };

  const handleAdd = () => {
    const d = draft;
    if (!d.date.trim()) {
      showMessage('error', 'Date is required.');
      return;
    }
    if (!(d.title.ta || d.title.en) || !(d.description.ta || d.description.en)) {
      showMessage('error', 'Fill in at least one language for title and description.');
      return;
    }
    const item: UpcomingEventItem = {
      date: d.date.trim(),
      title: { ta: d.title.ta.trim(), en: d.title.en.trim() },
      description: { ta: d.description.ta.trim(), en: d.description.en.trim() },
      ...(d.link?.trim() ? { link: d.link.trim() } : {}),
    };
    saveEvents([item, ...events]);
    setDraft(emptyDraft());
  };

  const handleDelete = (index: number) => {
    if (window.confirm('Delete this event?')) {
      saveEvents(events.filter((_, i) => i !== index));
    }
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    const e = events[index];
    setEditDraft({
      date: e.date,
      title: { ...e.title },
      description: { ...e.description },
      link: e.link || '',
    });
  };

  const saveEdit = (index: number) => {
    const d = editDraft;
    if (!d.date.trim()) {
      showMessage('error', 'Date is required.');
      return;
    }
    if (!(d.title.ta || d.title.en) || !(d.description.ta || d.description.en)) {
      showMessage('error', 'Fill in at least one language for title and description.');
      return;
    }
    const next = [...events];
    next[index] = {
      date: d.date.trim(),
      title: { ta: d.title.ta.trim(), en: d.title.en.trim() },
      description: { ta: d.description.ta.trim(), en: d.description.en.trim() },
      ...(d.link?.trim() ? { link: d.link.trim() } : {}),
    };
    saveEvents(next);
    setEditingIndex(null);
  };

  const moveUp = (index: number) => {
    if (index <= 0) return;
    const next = [...events];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    saveEvents(next);
  };

  const moveDown = (index: number) => {
    if (index >= events.length - 1) return;
    const next = [...events];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    saveEvents(next);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 md:pt-28 lg:pt-32 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <a
              href="/admin/dashboard"
              className="text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center gap-2 transition-colors"
            >
              ← Back to Dashboard
            </a>
            <h1 className="text-4xl font-bold text-primary-700 mb-2">Upcoming events (homepage)</h1>
            <p className="text-gray-600">
              These cards appear under <strong>Education &amp; Community</strong> on the home page. Data is stored in Cloudflare KV (
              <code className="bg-gray-100 px-1 rounded text-sm">upcomingEvents</code>).
            </p>
          </div>

          {message.text && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-primary-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Live site (Cloudflare KV)</h2>
            <p className="text-sm text-gray-600 mb-3">
              Log in at <strong>/admin/login</strong> so saves use your session. Or paste <code className="bg-gray-100 px-1 rounded">TMK_ADMIN_API_KEY</code> below.
            </p>
            {apiKey ? (
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-medium">API key set.</span>
                <button type="button" onClick={clearApiKey} className="text-sm text-gray-500 hover:text-red-600 underline">
                  Clear key
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Paste TMK_ADMIN_API_KEY"
                  className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
                <button type="button" onClick={saveApiKey} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                  Save key
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Add event</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">Date (display text, e.g. 15 Mar 2026)</span>
                <input
                  type="text"
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:outline-none"
                  placeholder="e.g. Mar 15, 2026"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Title (Tamil)</span>
                <input
                  type="text"
                  value={draft.title.ta}
                  onChange={(e) => setDraft({ ...draft, title: { ...draft.title, ta: e.target.value } })}
                  className="mt-1 w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:outline-none font-tamil"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Title (English)</span>
                <input
                  type="text"
                  value={draft.title.en}
                  onChange={(e) => setDraft({ ...draft, title: { ...draft.title, en: e.target.value } })}
                  className="mt-1 w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:outline-none"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">Description (Tamil)</span>
                <textarea
                  value={draft.description.ta}
                  onChange={(e) => setDraft({ ...draft, description: { ...draft.description, ta: e.target.value } })}
                  rows={2}
                  className="mt-1 w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:outline-none font-tamil"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">Description (English)</span>
                <textarea
                  value={draft.description.en}
                  onChange={(e) => setDraft({ ...draft, description: { ...draft.description, en: e.target.value } })}
                  rows={2}
                  className="mt-1 w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:outline-none"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">Learn more link (optional)</span>
                <input
                  type="text"
                  value={draft.link || ''}
                  onChange={(e) => setDraft({ ...draft, link: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:outline-none"
                  placeholder="/contact or https://…"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              className="mt-4 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700"
            >
              Add event
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Current events ({events.length})</h2>
            {events.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No events. Add one above.</p>
            ) : (
              <div className="space-y-4">
                {events.map((ev, index) => (
                  <div key={index} className="border-2 border-gray-200 rounded-lg p-4">
                    {editingIndex === index ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="sm:col-span-2">
                          <span className="text-sm font-medium text-gray-700">Date</span>
                          <input
                            type="text"
                            value={editDraft.date}
                            onChange={(e) => setEditDraft({ ...editDraft, date: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border-2 border-primary-600 rounded-lg focus:outline-none"
                          />
                        </label>
                        <label>
                          <span className="text-sm font-medium text-gray-700">Title TA</span>
                          <input
                            type="text"
                            value={editDraft.title.ta}
                            onChange={(e) => setEditDraft({ ...editDraft, title: { ...editDraft.title, ta: e.target.value } })}
                            className="mt-1 w-full px-3 py-2 border rounded-lg font-tamil"
                          />
                        </label>
                        <label>
                          <span className="text-sm font-medium text-gray-700">Title EN</span>
                          <input
                            type="text"
                            value={editDraft.title.en}
                            onChange={(e) => setEditDraft({ ...editDraft, title: { ...editDraft.title, en: e.target.value } })}
                            className="mt-1 w-full px-3 py-2 border rounded-lg"
                          />
                        </label>
                        <label className="sm:col-span-2">
                          <span className="text-sm font-medium text-gray-700">Description TA</span>
                          <textarea
                            value={editDraft.description.ta}
                            onChange={(e) => setEditDraft({ ...editDraft, description: { ...editDraft.description, ta: e.target.value } })}
                            rows={2}
                            className="mt-1 w-full px-3 py-2 border rounded-lg font-tamil"
                          />
                        </label>
                        <label className="sm:col-span-2">
                          <span className="text-sm font-medium text-gray-700">Description EN</span>
                          <textarea
                            value={editDraft.description.en}
                            onChange={(e) => setEditDraft({ ...editDraft, description: { ...editDraft.description, en: e.target.value } })}
                            rows={2}
                            className="mt-1 w-full px-3 py-2 border rounded-lg"
                          />
                        </label>
                        <label className="sm:col-span-2">
                          <span className="text-sm font-medium text-gray-700">Link (optional)</span>
                          <input
                            type="text"
                            value={editDraft.link || ''}
                            onChange={(e) => setEditDraft({ ...editDraft, link: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border rounded-lg"
                          />
                        </label>
                        <div className="sm:col-span-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => saveEdit(index)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingIndex(null)}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
                        <div>
                          <div className="text-sm text-primary font-semibold">{ev.date}</div>
                          <div className="font-tamil font-semibold text-gray-900">{ev.title.ta || '—'}</div>
                          <div className="text-gray-800">{ev.title.en || '—'}</div>
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{ev.description.en || ev.description.ta}</p>
                          {ev.link ? (
                            <div className="text-xs text-gray-500 mt-1">
                              Link: {ev.link}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0">
                          <button type="button" onClick={() => moveUp(index)} disabled={index === 0} className="p-2 text-gray-600 hover:text-primary-600 disabled:opacity-30" title="Move up">
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveDown(index)}
                            disabled={index === events.length - 1}
                            className="p-2 text-gray-600 hover:text-primary-600 disabled:opacity-30"
                            title="Move down"
                          >
                            ↓
                          </button>
                          <button type="button" onClick={() => startEdit(index)} className="px-3 py-1 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">
                            Edit
                          </button>
                          <button type="button" onClick={() => handleDelete(index)} className="px-3 py-1 text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
