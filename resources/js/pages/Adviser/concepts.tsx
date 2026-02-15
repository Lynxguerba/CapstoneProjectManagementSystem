import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, FileText, MessageSquareText, Search, XCircle } from 'lucide-react';
import AdviserLayout from './_layout';

type ConceptDecision = 'Pending' | 'Approved' | 'Rejected' | 'For Revision';

type Concept = {
  id: string;
  title: string;
  similarity: number;
  decision: ConceptDecision;
};

type GroupConceptBundle = {
  groupId: string;
  groupName: string;
  updatedAt: string;
  concepts: Concept[];
};

const AdviserConcepts = () => {
  const [query, setQuery] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  const bundles: GroupConceptBundle[] = [
    {
      groupId: 'g1',
      groupName: 'Group Alpha',
      updatedAt: '2026-03-12',
      concepts: [
        { id: 'c1', title: 'Capstone Project Management System', similarity: 12, decision: 'Pending' },
        { id: 'c2', title: 'Student Capstone Tracker with Notifications', similarity: 22, decision: 'Pending' },
        { id: 'c3', title: 'Project Workflow Portal for Capstone Teams', similarity: 18, decision: 'Pending' },
      ],
    },
    {
      groupId: 'g2',
      groupName: 'Group Beta',
      updatedAt: '2026-03-10',
      concepts: [
        { id: 'c4', title: 'Smart Queue for Clinic', similarity: 35, decision: 'Rejected' },
        { id: 'c5', title: 'Appointment + Queue Hybrid System', similarity: 28, decision: 'For Revision' },
        { id: 'c6', title: 'Health Center Queue Analytics Dashboard', similarity: 16, decision: 'Approved' },
      ],
    },
  ];

  const filteredBundles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return bundles;
    }

    return bundles.filter((b) => b.groupName.toLowerCase().includes(q) || b.concepts.some((c) => c.title.toLowerCase().includes(q)));
  }, [bundles, query]);

  const selectedGroup = useMemo(() => filteredBundles.find((b) => b.groupId === selectedGroupId) ?? null, [filteredBundles, selectedGroupId]);
  const selectedConcept = useMemo(() => selectedGroup?.concepts.find((c) => c.id === selectedConceptId) ?? null, [selectedConceptId, selectedGroup]);

  const decisionPill = (d: ConceptDecision): string => {
    if (d === 'Approved') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    if (d === 'Rejected') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }

    if (d === 'For Revision') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }

    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const setDecision = (decision: ConceptDecision) => {
    if (!selectedGroup || !selectedConcept) {
      return;
    }

    alert(`UI only: set ${selectedConcept.title} to ${decision}`);
  };

  return (
    <AdviserLayout title="Concepts" subtitle="Review and approve/reject concept proposals (UI only)">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="xl:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-slate-700" />
              <div>
                <div className="text-lg font-semibold text-slate-900">Submissions</div>
                <div className="text-sm text-slate-500">Select a group to review.</div>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-600 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">UI only</span>
          </div>

          <div className="mt-5 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search group or title..."
              className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="mt-5 space-y-3">
            {filteredBundles.map((b) => {
              const active = b.groupId === selectedGroupId;
              const pendingCount = b.concepts.filter((c) => c.decision === 'Pending').length;
              return (
                <button
                  key={b.groupId}
                  type="button"
                  onClick={() => {
                    setSelectedGroupId(b.groupId);
                    setSelectedConceptId(null);
                    setFeedback('');
                  }}
                  className={`w-full text-left rounded-2xl border p-4 transition-colors ${active ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{b.groupName}</div>
                      <div className="mt-1 text-xs text-slate-500">Updated: {b.updatedAt}</div>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 whitespace-nowrap">
                      {pendingCount} pending
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {!selectedGroup ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center">
              <div className="text-lg font-semibold text-slate-900">Select a submission</div>
              <div className="mt-2 text-sm text-slate-600">Choose a group from the left panel to review concepts.</div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Group</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900">{selectedGroup.groupName}</div>
                  <div className="mt-2 text-sm text-slate-600">Compare originality via similarity percent (dummy).</div>
                </div>
                <button
                  type="button"
                  onClick={() => alert('UI only: open title repository')}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Open Title Repository
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {selectedGroup.concepts.map((c) => {
                  const active = c.id === selectedConceptId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedConceptId(c.id);
                        setFeedback('');
                      }}
                      className={`text-left rounded-2xl border p-5 transition-colors ${active ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                    >
                      <div className="text-sm font-semibold text-slate-900 line-clamp-2">{c.title}</div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${decisionPill(c.decision)}`}>
                          {c.decision}
                        </span>
                        <span className="text-xs font-semibold text-slate-600 rounded-full border border-slate-200 bg-white px-3 py-1 whitespace-nowrap">
                          {c.similarity}% similar
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {!selectedConcept ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
                  <div className="text-sm font-semibold text-slate-900">Select a concept</div>
                  <div className="mt-1 text-sm text-slate-600">Pick one of the three proposals to approve/reject or request revision.</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="text-sm font-semibold text-slate-900">Concept Detail</div>
                    <div className="mt-2 text-sm text-slate-700 font-semibold">{selectedConcept.title}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${decisionPill(selectedConcept.decision)}`}>
                        {selectedConcept.decision}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                        Similarity: {selectedConcept.similarity}%
                      </span>
                    </div>

                    <div className="mt-5">
                      <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Preview</div>
                      <div className="mt-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                        <div className="text-sm font-semibold text-slate-800">Concept PDF preview area</div>
                        <div className="mt-1 text-sm text-slate-600">UI placeholder only.</div>
                        <button
                          type="button"
                          onClick={() => alert('UI only: open preview')}
                          className="mt-4 rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-800"
                        >
                          Open preview
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <MessageSquareText size={18} className="text-slate-700" />
                        <div className="text-sm font-semibold text-slate-900">Feedback</div>
                      </div>
                      <span className="text-xs font-semibold text-slate-600">UI only</span>
                    </div>

                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Add adviser feedback comment..."
                      className="mt-4 h-32 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setDecision('Approved')}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-emerald-700"
                      >
                        <CheckCircle2 size={16} />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecision('For Revision')}
                        className="rounded-xl bg-amber-500 text-white px-4 py-2.5 text-sm font-semibold hover:bg-amber-600"
                      >
                        Request revision
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecision('Rejected')}
                        className="inline-flex items-center gap-2 rounded-xl bg-rose-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-rose-700"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                      <div className="text-sm font-semibold text-slate-900">Rule</div>
                      <div className="mt-1 text-sm text-slate-600">Only one concept can be marked as approved per group (enforced later in backend).</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.section>

        <AnimatePresence>
          {selectedGroupId && selectedConceptId && false ? (
            <motion.div />
          ) : null}
        </AnimatePresence>
      </div>
    </AdviserLayout>
  );
};

export default AdviserConcepts;
