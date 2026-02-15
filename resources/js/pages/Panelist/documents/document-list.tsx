import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, FileText, Filter, FolderOpen, Search } from 'lucide-react';
import PanelLayout from '../_layout';

type ReviewStatus = 'Not Reviewed' | 'In Progress' | 'Reviewed' | 'Needs Revision';

type DocCategory = 'Proposal Manuscript' | 'Presentation Slides' | 'Final Manuscript' | 'Supporting Documents';

type DocumentRow = {
  id: string;
  group: string;
  defenseType: 'Outline' | 'Pre-Deployment' | 'Final';
  category: DocCategory;
  fileName: string;
  uploadedAt: string;
  status: ReviewStatus;
};

const PanelistDocumentList = () => {
  const [query, setQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ReviewStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | DocCategory>('all');

  const documents: DocumentRow[] = [
    {
      id: 'd1',
      group: 'Group Alpha',
      defenseType: 'Outline',
      category: 'Proposal Manuscript',
      fileName: 'Proposal_Manuscript_v1.pdf',
      uploadedAt: '2026-03-12',
      status: 'In Progress',
    },
    {
      id: 'd2',
      group: 'Group Alpha',
      defenseType: 'Outline',
      category: 'Presentation Slides',
      fileName: 'Slides_Outline_v1.pptx',
      uploadedAt: '2026-03-13',
      status: 'Not Reviewed',
    },
    {
      id: 'd3',
      group: 'Group Beta',
      defenseType: 'Pre-Deployment',
      category: 'Final Manuscript',
      fileName: 'Manuscript_PreDeploy_v2.pdf',
      uploadedAt: '2026-03-11',
      status: 'Needs Revision',
    },
    {
      id: 'd4',
      group: 'Group Delta',
      defenseType: 'Final',
      category: 'Supporting Documents',
      fileName: 'Supporting_Docs.zip',
      uploadedAt: '2026-03-10',
      status: 'Reviewed',
    },
  ];

  const groups = useMemo(() => Array.from(new Set(documents.map((d) => d.group))), [documents]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return documents.filter((d) => {
      const matchesQuery =
        !q ||
        d.group.toLowerCase().includes(q) ||
        d.fileName.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.defenseType.toLowerCase().includes(q);

      const matchesGroup = groupFilter === 'all' || d.group === groupFilter;
      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;

      return matchesQuery && matchesGroup && matchesStatus && matchesCategory;
    });
  }, [documents, query, groupFilter, statusFilter, categoryFilter]);

  const pill = (s: ReviewStatus): string => {
    if (s === 'Reviewed') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    if (s === 'In Progress') {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }

    if (s === 'Needs Revision') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }

    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <PanelLayout title="Document Review Center" subtitle="Centralized document queue (UI only)">
      <div className="space-y-6">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-2">
              <FolderOpen size={18} className="text-slate-700" />
              <div>
                <div className="text-lg font-semibold text-slate-900">Documents</div>
                <div className="text-sm text-slate-500">Filter by group, status, and category.</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-72">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search group, file, category..."
                  className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="relative w-full sm:w-48">
                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All groups</option>
                  {groups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative w-full sm:w-56">
                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All categories</option>
                  <option value="Proposal Manuscript">Proposal Manuscript</option>
                  <option value="Presentation Slides">Presentation Slides</option>
                  <option value="Final Manuscript">Final Manuscript</option>
                  <option value="Supporting Documents">Supporting Documents</option>
                </select>
              </div>

              <div className="relative w-full sm:w-52">
                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All status</option>
                  <option value="Not Reviewed">Not Reviewed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Needs Revision">Needs Revision</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="text-left py-3 font-semibold">Group</th>
                  <th className="text-left py-3 font-semibold">Defense</th>
                  <th className="text-left py-3 font-semibold">Category</th>
                  <th className="text-left py-3 font-semibold">File</th>
                  <th className="text-left py-3 font-semibold">Uploaded</th>
                  <th className="text-left py-3 font-semibold">Status</th>
                  <th className="text-right py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="py-3 font-medium text-slate-900 whitespace-nowrap">{d.group}</td>
                    <td className="py-3 text-slate-700 whitespace-nowrap">{d.defenseType}</td>
                    <td className="py-3 text-slate-700 whitespace-nowrap">{d.category}</td>
                    <td className="py-3 text-slate-700 min-w-[220px]">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-slate-500" />
                        <span className="truncate">{d.fileName}</span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-700 whitespace-nowrap">{d.uploadedAt}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${pill(d.status)}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href="/panelist/documents/viewer"
                          className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 text-white px-3 py-2 text-xs font-semibold hover:shadow inline-flex items-center gap-2"
                        >
                          <Eye size={14} />
                          View
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-600">
                      No documents found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>
    </PanelLayout>
  );
};

export default PanelistDocumentList;
