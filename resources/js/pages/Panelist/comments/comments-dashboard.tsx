import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MessageSquareText, PieChart as PieIcon, Search } from 'lucide-react';
import PanelLayout from '../_layout';

type CommentType = 'Suggestion' | 'Issue/Error' | 'Approval/Good Practice' | 'Question/Clarification';

type CommentRow = {
  id: string;
  group: string;
  document: string;
  pageRef: string;
  type: CommentType;
  preview: string;
  dateAdded: string;
};

const PanelistCommentsDashboard = () => {
  const comments: CommentRow[] = useMemo(
    () => [
      {
        id: 'c1',
        group: 'Group Alpha',
        document: 'Proposal_Manuscript_v1.pdf',
        pageRef: 'Page 3, Introduction',
        type: 'Issue/Error',
        preview: 'Clarify the problem statement; it feels too broad.',
        dateAdded: '2026-03-13',
      },
      {
        id: 'c2',
        group: 'Group Alpha',
        document: 'Slides_Outline_v1.pptx',
        pageRef: 'Slide 4, Scope',
        type: 'Suggestion',
        preview: 'Consider using a simple workflow diagram.',
        dateAdded: '2026-03-13',
      },
      {
        id: 'c3',
        group: 'Group Delta',
        document: 'Final_Manuscript_v3.pdf',
        pageRef: 'Page 18, Results',
        type: 'Approval/Good Practice',
        preview: 'Good clarity in your evaluation section and results discussion.',
        dateAdded: '2026-03-11',
      },
    ],
    []
  );

  const totals = useMemo(() => {
    const byType = comments.reduce<Record<CommentType, number>>(
      (acc, c) => {
        acc[c.type] = (acc[c.type] ?? 0) + 1;
        return acc;
      },
      {
        Suggestion: 0,
        'Issue/Error': 0,
        'Approval/Good Practice': 0,
        'Question/Clarification': 0,
      }
    );

    const total = comments.length;
    const topGroup = comments.reduce<Record<string, number>>((acc, c) => {
      acc[c.group] = (acc[c.group] ?? 0) + 1;
      return acc;
    }, {});

    const topGroupName = Object.entries(topGroup).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

    return { byType, total, topGroupName };
  }, [comments]);

  const pill = (type: CommentType): string => {
    if (type === 'Issue/Error') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }

    if (type === 'Approval/Good Practice') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    if (type === 'Question/Clarification') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }

    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  };

  return (
    <PanelLayout title="Comments & Feedback" subtitle="Manage your comments across all documents (UI only)">
      <div className="space-y-6">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {[
            { label: 'Total Comments', value: totals.total, tone: 'from-slate-900 to-slate-700' },
            { label: 'Suggestions', value: totals.byType.Suggestion, tone: 'from-indigo-500 to-violet-500' },
            { label: 'Issues / Errors', value: totals.byType['Issue/Error'], tone: 'from-rose-500 to-pink-500' },
            { label: 'Top Group', value: totals.topGroupName, tone: 'from-emerald-500 to-teal-500' },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{card.label}</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{card.value}</div>
              <div className={`mt-4 h-1 rounded-full bg-gradient-to-r ${card.tone}`} />
            </div>
          ))}
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-2">
              <MessageSquareText size={18} className="text-slate-700" />
              <div>
                <div className="text-lg font-semibold text-slate-900">Comments Table</div>
                <div className="text-sm text-slate-500">Filter/search can be wired later.</div>
              </div>
            </div>

            <div className="relative w-full lg:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                placeholder="Search comments..."
                className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="text-left py-3 font-semibold">Group</th>
                  <th className="text-left py-3 font-semibold">Document</th>
                  <th className="text-left py-3 font-semibold">Page/Section</th>
                  <th className="text-left py-3 font-semibold">Type</th>
                  <th className="text-left py-3 font-semibold">Preview</th>
                  <th className="text-left py-3 font-semibold">Date</th>
                  <th className="text-right py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comments.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3 font-medium text-slate-900 whitespace-nowrap">{c.group}</td>
                    <td className="py-3 text-slate-700 min-w-[220px]">{c.document}</td>
                    <td className="py-3 text-slate-700 whitespace-nowrap">{c.pageRef}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${pill(c.type)}`}>
                        {c.type}
                      </span>
                    </td>
                    <td className="py-3 text-slate-700 min-w-[260px]">{c.preview}</td>
                    <td className="py-3 text-slate-700 whitespace-nowrap">{c.dateAdded}</td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => alert('UI only: view/edit')}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                        >
                          View/Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => alert('UI only: delete')}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => alert('UI only: export to PDF')}
              className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 text-white px-4 py-2.5 text-sm font-semibold hover:shadow inline-flex items-center justify-center gap-2"
            >
              <PieIcon size={16} />
              Export comments (PDF)
            </button>
            <button
              type="button"
              onClick={() => alert('UI only: open viewer')}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Open document viewer
            </button>
          </div>
        </motion.section>
      </div>
    </PanelLayout>
  );
};

export default PanelistCommentsDashboard;
