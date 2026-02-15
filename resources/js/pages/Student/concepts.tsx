import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, MessageSquareText, Upload, X } from 'lucide-react';
import StudentLayout from './_layout';

type ConceptStatus = 'Pending' | 'Approved' | 'Rejected' | 'Resubmit Required';

type Concept = {
  id: string;
  title: string;
  status: ConceptStatus;
  updatedAt: string;
};

type SubmissionHistoryItem = {
  id: string;
  date: string;
  action: string;
  note: string;
};

const StudentConcepts = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  const concepts: Concept[] = [
    { id: 'c1', title: 'Capstone Project Management System', status: 'Approved', updatedAt: '2026-03-10' },
    { id: 'c2', title: 'Smart Queue System for Campus Clinic', status: 'Resubmit Required', updatedAt: '2026-03-12' },
    { id: 'c3', title: 'Thesis Repository with Similarity Search', status: 'Pending', updatedAt: '2026-03-14' },
  ];

  const selected = useMemo(() => concepts.find((c) => c.id === selectedId) ?? null, [concepts, selectedId]);

  const history: SubmissionHistoryItem[] = [
    { id: 'h1', date: '2026-03-01', action: 'Submitted Concept v1', note: 'Initial submission' },
    { id: 'h2', date: '2026-03-05', action: 'Adviser Comment', note: 'Please refine objectives and scope.' },
    { id: 'h3', date: '2026-03-12', action: 'Marked as Resubmit Required', note: 'Update methodology section.' },
  ];

  const statusPill = (s: ConceptStatus): string => {
    if (s === 'Approved') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    if (s === 'Rejected') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }

    if (s === 'Resubmit Required') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }

    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const canResubmit = selected?.status === 'Rejected' || selected?.status === 'Resubmit Required';
  const isLocked = selected?.status === 'Approved';

  return (
    <StudentLayout title="Concept Submission" subtitle="Submit up to 3 concepts (UI only)">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="xl:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-slate-700" />
              <h3 className="text-lg font-semibold text-slate-900">Concept List</h3>
            </div>
            <span className="text-xs font-semibold text-slate-600 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              Max 3
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {concepts.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedId(c.id);
                  setDescription('');
                }}
                className={`w-full text-left rounded-2xl border p-4 transition-colors ${selectedId === c.id
                  ? 'border-indigo-200 bg-indigo-50'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{c.title}</div>
                    <div className="mt-1 text-xs text-slate-500">Updated: {c.updatedAt}</div>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusPill(c.status)}`}>
                    {c.status}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
            <div className="text-sm font-semibold text-slate-900">Auto duplication checker</div>
            <div className="mt-1 text-sm text-slate-600">Runs when you submit a concept title (dummy behavior).</div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          {!selected ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <div className="text-lg font-semibold text-slate-900">Select a concept</div>
              <div className="mt-2 text-sm text-slate-600">Choose an item on the left to view details.</div>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Concept Detail</div>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">{selected.title}</h3>
                  <div className="mt-2 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-50 border-slate-200">
                    Status: {selected.status}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={!canResubmit}
                    onClick={() => alert('UI only: resubmit concept')}
                    className="rounded-xl bg-indigo-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Resubmit
                  </button>
                  <button
                    type="button"
                    onClick={() => alert('UI only: view submission history')}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    View history
                  </button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-900">Description (UI only)</div>
                    <span className={`text-xs font-semibold rounded-full border px-3 py-1 ${isLocked
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isLocked ? 'Locked' : 'Editable'}
                    </span>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Write your concept summary here..."
                    disabled={isLocked}
                    className="mt-3 h-44 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50"
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="text-sm font-semibold text-slate-900">File Upload</div>
                  <div className="mt-1 text-sm text-slate-600">PDF/DOC (dummy upload)</div>

                  <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                    <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold">
                      <Upload size={16} />
                      Drag & drop or browse
                    </div>
                    <div className="mt-2 text-xs text-slate-500">Validation happens in backend later.</div>
                    <button
                      type="button"
                      onClick={() => alert('UI only: pick file')}
                      className="mt-4 rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-800"
                    >
                      Choose file
                    </button>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Adviser Comments</div>
                    <div className="mt-2 flex items-start gap-3">
                      <MessageSquareText size={18} className="text-indigo-600 mt-0.5" />
                      <div className="text-sm text-slate-700">
                        Please improve your methodology and specify your target users.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-900">Submission History</div>
                  <button
                    type="button"
                    onClick={() => alert('UI only: export history')}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Export
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {history.map((h) => (
                    <div key={h.id} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{h.date}</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">{h.action}</div>
                      <div className="mt-1 text-sm text-slate-600">{h.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </motion.section>

        <AnimatePresence>
          {selectedId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="xl:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setSelectedId(null)}
            >
              <motion.div
                initial={{ y: 18, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 18, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                  <div className="text-sm font-semibold text-slate-900">Concept Detail</div>
                  <button type="button" onClick={() => setSelectedId(null)} className="text-slate-600 hover:text-slate-900">
                    <X size={18} />
                  </button>
                </div>
                <div className="p-5">
                  <div className="text-sm text-slate-700">On mobile, use the desktop view for full detail layout.</div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </StudentLayout>
  );
};

export default StudentConcepts;
