import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Eye, FileText, FolderOpen, MessageSquareText, Search } from 'lucide-react';
import AdviserLayout from './_layout';

type DocStatus = 'Approved' | 'For Revision' | 'Rejected' | 'Pending';

type DocumentItem = {
  id: string;
  group: string;
  name: string;
  type: string;
  submittedAt: string;
  status: DocStatus;
};

const AdviserDocuments = () => {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const documents: DocumentItem[] = [
    { id: 'd1', group: 'Group Alpha', name: 'Chapter 1–3', type: 'Outline', submittedAt: '2026-03-12', status: 'Pending' },
    { id: 'd2', group: 'Group Beta', name: 'Full Manuscript v1', type: 'Pre-Oral', submittedAt: '2026-03-10', status: 'For Revision' },
    { id: 'd3', group: 'Group Gamma', name: 'Revised Manuscript v2', type: 'Pre-Oral', submittedAt: '2026-03-11', status: 'Approved' },
    { id: 'd4', group: 'Group Delta', name: 'Final Copy', type: 'Final', submittedAt: '2026-03-14', status: 'Pending' },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return documents;
    }

    return documents.filter((d) => d.group.toLowerCase().includes(q) || d.name.toLowerCase().includes(q) || d.type.toLowerCase().includes(q));
  }, [documents, query]);

  const selected = useMemo(() => filtered.find((d) => d.id === selectedId) ?? null, [filtered, selectedId]);

  const statusPill = (s: DocStatus): string => {
    if (s === 'Approved') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    if (s === 'Rejected') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }

    if (s === 'For Revision') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }

    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <AdviserLayout title="Documents" subtitle="Review phase-based documents (UI only)">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="xl:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2">
            <FolderOpen size={18} className="text-slate-700" />
            <div>
              <div className="text-lg font-semibold text-slate-900">Submission Queue</div>
              <div className="text-sm text-slate-500">Pick a document to review.</div>
            </div>
          </div>

          <div className="mt-5 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search group, file, type..."
              className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="mt-5 space-y-3">
            {filtered.map((d) => {
              const active = d.id === selectedId;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(d.id);
                    setComment('');
                  }}
                  className={`w-full text-left rounded-2xl border p-4 transition-colors ${active ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{d.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{d.group} • {d.type}</div>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusPill(d.status)}`}>
                      {d.status}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">Submitted: {d.submittedAt}</div>
                </button>
              );
            })}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {!selected ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center">
              <div className="text-lg font-semibold text-slate-900">Select a document</div>
              <div className="mt-2 text-sm text-slate-600">Choose an item from the queue to view preview/actions.</div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Document</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900">{selected.name}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                      {selected.group}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      Type: {selected.type}
                    </span>
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusPill(selected.status)}`}>
                      {selected.status}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => alert('UI only: preview file')}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    <Eye size={16} />
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => alert('UI only: download file')}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-800"
                  >
                    <Download size={16} />
                    Download
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-slate-700" />
                    <div>
                      <div className="text-sm font-semibold text-slate-900">File Preview</div>
                      <div className="text-sm text-slate-600">Placeholder preview area.</div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                    <div className="text-sm font-semibold text-slate-900">PDF preview not connected</div>
                    <div className="mt-2 text-sm text-slate-600">Backend integration later.</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="flex items-center gap-2">
                    <MessageSquareText size={18} className="text-slate-700" />
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Comments</div>
                      <div className="text-sm text-slate-600">Write feedback and update status (UI only).</div>
                    </div>
                  </div>

                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add your feedback..."
                    className="mt-4 h-32 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => alert('UI only: approve')} className="rounded-xl bg-emerald-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-emerald-700">
                      Approve
                    </button>
                    <button type="button" onClick={() => alert('UI only: for revision')} className="rounded-xl bg-amber-500 text-white px-4 py-2.5 text-sm font-semibold hover:bg-amber-600">
                      For Revision
                    </button>
                    <button type="button" onClick={() => alert('UI only: reject')} className="rounded-xl bg-rose-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-rose-700">
                      Reject
                    </button>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Revision history</div>
                    <div className="mt-2 space-y-2">
                      {[
                        { date: '2026-03-10', action: 'Submitted v1' },
                        { date: '2026-03-11', action: 'Adviser comment added' },
                      ].map((h) => (
                        <div key={h.date} className="flex items-center justify-between text-sm">
                          <div className="font-semibold text-slate-700">{h.date}</div>
                          <div className="text-slate-600">{h.action}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.section>
      </div>
    </AdviserLayout>
  );
};

export default AdviserDocuments;
