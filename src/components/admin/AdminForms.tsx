import { useEffect } from 'react';

/**
 * Zero-cost Forms admin: no R2, no upload API.
 * Forms are static files in public/forms/. To update, replace the file in the repo and redeploy.
 */

const FORMS = [
  {
    id: 'donation',
    title: 'Donation Form (Bankers & Member)',
    path: 'public/forms/Bankers_and_Member_Form_NOV_23.pdf',
    url: '/forms/Bankers_and_Member_Form_NOV_23.pdf',
    format: 'PDF',
  },
  {
    id: 'admission',
    title: 'Tamil School Admission Form',
    path: 'public/forms/Tamil_School_Admission_Form_New_V3.0.docx',
    url: '/forms/Tamil_School_Admission_Form_New_V3.0.docx',
    format: 'Word (.docx)',
  },
] as const;

export default function AdminForms() {
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('adminLoggedIn') !== 'true') {
      window.location.href = '/admin/login';
      return;
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 md:pt-28 lg:pt-32 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <a href="/admin/dashboard" className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block">
              ← Back to Dashboard
            </a>
            <h1 className="text-3xl md:text-4xl font-bold text-primary-700">Forms</h1>
            <p className="text-gray-600 mt-1">Donation and admission forms are served as static files. To update them, replace the file in your project and redeploy — no extra cost, no cloud storage.</p>
          </div>

          <div className="space-y-6">
            {FORMS.map((form) => (
              <div key={form.id} className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{form.title}</h2>
                <p className="text-sm text-gray-500 mb-2">Format: {form.format}</p>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>File in project:</strong> <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{form.path}</code>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  To update: replace this file in your repo (keep the same name or update links on the Donation / Student Registration pages), then commit and redeploy.
                </p>
                <a
                  href={form.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  View / download current form
                </a>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
            <strong>Zero cost:</strong> No R2 or other storage. Forms live in <code className="bg-green-100 px-1 rounded">public/forms/</code> and are deployed with the site.
          </div>
        </div>
      </div>
    </div>
  );
}
