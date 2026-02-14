import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import InstructorLayout from './_layout';

type ConceptStatus = 'Pending' | 'Approved' | 'Rejected';

type ConceptRow = {
  id: string;
  group: string;
  title: string;
  status: ConceptStatus;
  lastUpdated: string;
  adviserComment: string;
  attachmentName: string;
};

const ConceptsPage = () => {
  const [tab, setTab] = useState<ConceptStatus>('Pending');
  const [search, setSearch] = useState('');

  const concepts: ConceptRow[] = [
    {
      id: 'c1',
      group: 'Group 1',
      title: 'Capstone Projects Management System',
      status: 'Pending',
      lastUpdated: '2026-03-12',
      adviserComment: 'Needs clearer scope and target users.',
      attachmentName: 'concept-paper-group1.pdf',
    },
    {
      id: 'c2',
      group: 'Group 2',
      title: 'Smart Attendance with QR + Face Match',
      status: 'Approved',
      lastUpdated: '2026-03-09',
      adviserComment: 'Solid baseline, proceed to proposal.',
      attachmentName: 'concept-paper-group2.pdf',
    },
    {
      id: 'c3',
      group: 'Group 3',
      title: 'Inventory Forecasting for Campus Supplies',
      status: 'Rejected',
      lastUpdated: '2026-03-07',
      adviserComment: 'Duplicate of previous batch; revise topic.',
      attachmentName: 'concept-paper-group3.pdf',
    },
  ];

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return concepts.filter((c) => {
      const matchesTab = c.status === tab;
      const matchesSearch = !s || c.group.toLowerCase().includes(s) || c.title.toLowerCase().includes(s);
      return matchesTab && matchesSearch;
    });
  }, [concepts, tab, search]);

  const tabStyle = (isActive: boolean) =>
    isActive
      ? 'bg-slate-900 text-white shadow'
      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50';

  const statusBadge = (value: ConceptStatus) => {
    const map: Record<ConceptStatus, string> = {
      Pending: 'bg-amber-100 text-amber-700',
      Approved: 'bg-teal-100 text-teal-700',
      Rejected: 'bg-rose-100 text-rose-700',
    };

    return map[value];
  };

  return (
    <InstructorLayout title="Concept Review" subtitle="Monitor concept approvals and view submission history">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex gap-2 flex-wrap">
              <button className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tabStyle(tab === 'Pending')}`} onClick={() => setTab('Pending')}>
                Pending
              </button>
              <button className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tabStyle(tab === 'Approved')}`} onClick={() => setTab('Approved')}>
                Approved
              </button>
              <button className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tabStyle(tab === 'Rejected')}`} onClick={() => setTab('Rejected')}>
                Rejected
              </button>
            </div>

            <div className="flex gap-3 flex-wrap">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search group or title..."
                className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
              />
              <button
                onClick={() => alert('UI only: open concept details panel')}
                className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all font-medium"
              >
                View Selected
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="text-left py-4 font-semibold">Group</th>
                  <th className="text-left py-4 font-semibold">Title</th>
                  <th className="text-left py-4 font-semibold">Status</th>
                  <th className="text-left py-4 font-semibold">Last Updated</th>
                  <th className="text-left py-4 font-semibold">Attachment</th>
                  <th className="text-left py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 font-medium text-slate-800">{c.group}</td>
                    <td className="py-4 text-slate-700">{c.title}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(c.status)}`}>{c.status}</span>
                    </td>
                    <td className="py-4 text-slate-600">{c.lastUpdated}</td>
                    <td className="py-4 text-slate-600">{c.attachmentName}</td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => alert(`UI only: open details for ${c.group}`)}
                          className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => alert(`UI only: view adviser comments: ${c.adviserComment}`)}
                          className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-semibold hover:bg-slate-50 transition"
                        >
                          Comments
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">No concepts in this category.</div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </InstructorLayout>
  );
};

export default ConceptsPage;
