import { useState, useEffect } from 'react';

export type TickerPriority = 'high' | 'medium' | 'low';

export interface NewsTickerItem {
  text: string;
  priority: TickerPriority;
}

const PRIORITIES: { value: TickerPriority; label: string }[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

function normalizeItem(item: string | NewsTickerItem): NewsTickerItem {
  if (typeof item === 'string') return { text: item, priority: 'medium' };
  return { text: item.text, priority: item.priority || 'medium' };
}

export default function AdminNews() {
  const [newsItems, setNewsItems] = useState<NewsTickerItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [newPriority, setNewPriority] = useState<TickerPriority>('high');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editPriority, setEditPriority] = useState<TickerPriority>('medium');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Check authentication
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('adminLoggedIn') !== 'true') {
      window.location.href = '/admin/login';
      return;
    }
    loadNewsItems();
  }, []);

  const loadNewsItems = () => {
    if (typeof window === 'undefined') return;
    
    const stored = localStorage.getItem('newsTickerItems');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const items = Array.isArray(parsed)
          ? parsed.map(normalizeItem)
          : [];
        setNewsItems(items);
        return;
      } catch (e) {
        console.error('Error parsing stored news items:', e);
      }
    }

    const defaultItems: NewsTickerItem[] = [
      { text: 'Welcome to TMK London - Celebrating Tamil Culture and Heritage', priority: 'high' },
      { text: 'Follow us on social media for the latest updates and events', priority: 'medium' },
      { text: 'Tamil School registration is now open for the new academic year', priority: 'high' },
      { text: 'Join us for our upcoming cultural events and celebrations', priority: 'medium' },
    ];
    setNewsItems(defaultItems);
    localStorage.setItem('newsTickerItems', JSON.stringify(defaultItems));
  };

  const saveNewsItems = (items: NewsTickerItem[]) => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('newsTickerItems', JSON.stringify(items));
    setNewsItems(items);
    
    showMessage('success', '💾 News items saved successfully!');
    
    // Trigger a custom event to notify NewsTicker component
    window.dispatchEvent(new CustomEvent('newsTickerUpdated'));
  };

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleAdd = () => {
    if (newItem.trim()) {
      const updated = [{ text: newItem.trim(), priority: newPriority }, ...newsItems];
      saveNewsItems(updated);
      setNewItem('');
    }
  };

  const handleDelete = (index: number) => {
    if (window.confirm('Are you sure you want to delete this news item?')) {
      const updated = newsItems.filter((_, i) => i !== index);
      saveNewsItems(updated);
    }
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(newsItems[index].text);
    setEditPriority(newsItems[index].priority);
  };

  const handleSaveEdit = (index: number) => {
    if (editValue.trim()) {
      const updated = [...newsItems];
      updated[index] = { text: editValue.trim(), priority: editPriority };
      saveNewsItems(updated);
      setEditingIndex(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const updated = [...newsItems];
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      saveNewsItems(updated);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < newsItems.length - 1) {
      const updated = [...newsItems];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      saveNewsItems(updated);
    }
  };

  const handlePriorityChange = (index: number, priority: TickerPriority) => {
    const updated = [...newsItems];
    updated[index] = { ...updated[index], priority };
    saveNewsItems(updated);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 md:pt-28 lg:pt-32 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <a 
              href="/admin/dashboard" 
              className="text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center gap-2 transition-colors"
            >
              ← Back to Dashboard
            </a>
            <h1 className="text-4xl font-bold text-primary-700 mb-2">News Ticker Management</h1>
            <p className="text-gray-600">Manage the news items displayed in the ticker at the top of the website</p>
          </div>

          {/* Success/Error Message */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-300' 
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}>
              {message.text}
            </div>
          )}

          {/* Add New Item */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Add New News Item</h2>
            <div className="flex flex-wrap gap-3 items-center">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="Enter news item text..."
                className="flex-1 min-w-[200px] px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600 transition-colors"
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as TickerPriority)}
                className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600 bg-white"
                title="Priority (affects style on ticker)"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <button
                onClick={handleAdd}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg"
              >
                Add
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">Priority: High = bold/red, Medium = amber, Low = subtle. Latest (first) item gets extra highlight.</p>
          </div>

          {/* News Items List */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Current News Items ({newsItems.length})
            </h2>
            
            {newsItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No news items. Add one above to get started.</p>
            ) : (
              <div className="space-y-3">
                {newsItems.map((item, index) => (
                  <div
                    key={index}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary-500/50 transition-colors"
                  >
                    {editingIndex === index ? (
                      <div className="flex flex-wrap gap-3 items-center">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(index);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="flex-1 min-w-[200px] px-4 py-2 border-2 border-primary-600 rounded-lg focus:outline-none focus:border-primary-700"
                          autoFocus
                        />
                        <select
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value as TickerPriority)}
                          className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600 bg-white"
                        >
                          {PRIORITIES.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleSaveEdit(index)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="text-sm text-gray-500 mb-1 flex items-center gap-2 flex-wrap">
                            {index === 0 ? (
                              <span className="px-2 py-0.5 rounded bg-primary-100 text-primary-700 font-semibold text-xs">Latest (shows first)</span>
                            ) : (
                              <>Item #{index + 1}</>
                            )}
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              item.priority === 'high' ? 'bg-red-100 text-red-700' :
                              item.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {item.priority}
                            </span>
                          </div>
                          <div className="text-gray-800 font-medium">{item.text}</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="p-2 text-gray-600 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => handleMoveDown(index)}
                            disabled={index === newsItems.length - 1}
                            className="p-2 text-gray-600 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Move down"
                          >
                            ↓
                          </button>
                          <select
                            value={item.priority}
                            onChange={(e) => handlePriorityChange(index, e.target.value as TickerPriority)}
                            className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-primary-500"
                            title="Priority"
                          >
                            {PRIORITIES.map((p) => (
                              <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleEdit(index)}
                            className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(index)}
                            className="p-2 text-red-600 hover:text-red-700 transition-colors"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview Section */}
          {newsItems.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Preview</h2>
              <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 p-4 rounded-lg">
                <div className="text-white text-sm font-medium whitespace-nowrap overflow-hidden">
                  Latest News: {newsItems.map((i) => i.text).join(' • ')}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
