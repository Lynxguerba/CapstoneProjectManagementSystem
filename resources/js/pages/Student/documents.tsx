import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileUp, FolderOpen, History, Layers3 } from 'lucide-react';
import StudentLayout from './_layout';

type DocStatus = 'Pending' | 'Routed to Panel' | 'Approved';

type DocVersion = {
  id: string;
  version: string;
  uploadedAt: string;
  fileName: string;
  status: DocStatus;
};

type TabKey = 'proposal' | 'slides' | 'final' | 'supporting';

const StudentDocuments = () => {
  const [tab, setTab] = useState<TabKey>('proposal');

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'proposal', label: 'Proposal Manuscript' },
    { key: 'slides', label: 'Presentation Slides' },
    { key: 'final', label: 'Final Manuscript' },
    { key: 'supporting', label: 'Supporting Documents' },
  ];

  const data = useMemo<Record<TabKey, DocVersion[]>>(
    () => ({
      proposal: [
        { id: 'p1', version: 'v1', uploadedAt: '2026-03-01', fileName: 'proposal-v1.pdf', status: 'Pending' },
        { id: 'p2', version: 'v2', uploadedAt: '2026-03-12', fileName: 'proposal-v2.pdf', status: 'Routed to Panel' },
      ],
      slides: [
        { id: 's1', version: 'v1', uploadedAt: '2026-03-10', fileName: 'slides-outline-v1.pptx', status: 'Approved' },
      ],
      final: [
        { id: 'f1', version: 'v1', uploadedAt: '—', fileName: 'No upload yet', status: 'Pending' },
      ],
      supporting: [
        { id: 'x1', version: 'v1', uploadedAt: '2026-03-08', fileName: 'gantt-chart.xlsx', status: 'Approved' },
        { id: 'x2', version: 'v1', uploadedAt: '2026-03-09', fileName: 'minutes-draft.docx', status: 'Pending' },
      ],
    }),
    []
  );

  const statusPill = (s: DocStatus): string => {
    if (s === 'Approved') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    if (s === 'Routed to Panel') {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }

    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <StudentLayout title="Documents & Uploads" subtitle="Centralized file management (UI only)">
      <div className="space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                <FolderOpen size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Upload Center</h3>
                <p className="text-sm text-slate-500 mt-1">Version history, status badges, and downloads.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => alert('UI only: open upload modal')}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-800"
              >
                <FileUp size={16} />
                Upload file
              </button>
              <button
                type="button"
                onClick={() => alert('UI only: open history log')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                <History size={16} />
                History
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`text-sm font-semibold rounded-xl px-4 py-2.5 border transition-colors ${tab === t.key
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Layers3 size={18} className="text-slate-700" />
              <h3 className="text-lg font-semibold text-slate-900">{tabs.find((t) => t.key === tab)?.label}</h3>
            </div>
            <span className="text-xs font-semibold text-slate-600 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              {data[tab].length} version(s)
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="text-left py-3 font-semibold">Version</th>
                  <th className="text-left py-3 font-semibold">File</th>
                  <th className="text-left py-3 font-semibold">Uploaded</th>
                  <th className="text-left py-3 font-semibold">Status</th>
                  <th className="text-left py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data[tab].map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="py-3 font-medium text-slate-900 whitespace-nowrap">{d.version}</td>
                    <td className="py-3 text-slate-700 min-w-[260px]">{d.fileName}</td>
                    <td className="py-3 text-slate-600 whitespace-nowrap">{d.uploadedAt}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusPill(d.status)}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => alert('UI only: download file')}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                      >
                        <Download size={14} />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>
    </StudentLayout>
  );
};

export default StudentDocuments;
