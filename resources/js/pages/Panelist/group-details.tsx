import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, FolderOpen, Users } from 'lucide-react';
import PanelLayout from './_layout';

type DocStatus = 'Not Reviewed' | 'In Progress' | 'Reviewed';

type DocumentItem = {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  status: DocStatus;
};

type Member = {
  name: string;
  role: string;
  studentId: string;
};

const PanelistGroupDetails = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'history'>('overview');

  const group = {
    name: 'Group Alpha',
    projectTitle: 'Smart Attendance via QR',
    description:
      'A capstone system that streamlines attendance recording and reporting using QR scanning and analytics dashboards.',
    stack: ['Laravel', 'Inertia', 'React', 'MySQL', 'TailwindCSS'],
    adviser: 'Prof. L. Cruz',
    coPanelists: ['Prof. A. Reyes', 'Prof. J. Ramos'],
    defense: {
      type: 'Outline',
      schedule: '2026-03-21 • 9:00 AM',
      room: 'Room 101',
      paymentStatus: 'Verified',
    },
  } as const;

  const members: Member[] = [
    { name: 'Juan D.', role: 'PM/Analyst', studentId: '2022-0001' },
    { name: 'Maria S.', role: 'Programmer', studentId: '2022-0002' },
    { name: 'Carlo T.', role: 'Documentarian', studentId: '2022-0003' },
  ];

  const documents: DocumentItem[] = [
    { id: 'd1', name: 'Proposal Manuscript', type: 'PDF', uploadedAt: '2026-03-12', status: 'Not Reviewed' },
    { id: 'd2', name: 'Presentation Slides', type: 'PPTX', uploadedAt: '2026-03-13', status: 'In Progress' },
    { id: 'd3', name: 'Supporting Documents', type: 'ZIP', uploadedAt: '2026-03-10', status: 'Reviewed' },
  ];

  const evaluationHistory = useMemo(
    () => [
      { id: 'h1', defenseType: 'Concept', date: '2026-02-10', score: 84, verdict: 'Approved', notes: 'Scope aligned; proceed to outline.' },
      { id: 'h2', defenseType: 'Outline', date: '2026-03-21', score: null as number | null, verdict: 'Pending', notes: 'Awaiting your evaluation submission.' },
    ],
    []
  );

  const statusPill = (s: DocStatus): string => {
    if (s === 'Reviewed') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    if (s === 'In Progress') {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }

    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const tabButton = (key: typeof activeTab, label: string): string => {
    const active = activeTab === key;
    return `rounded-xl px-4 py-2 text-sm font-semibold border transition-colors ${active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`;
  };

  return (
    <PanelLayout title="Group Details" subtitle="Project information, documents, and history (UI only)">
      <div className="space-y-6">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{group.name}</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{group.projectTitle}</div>
              <div className="mt-3 text-sm text-slate-600 max-w-3xl">{group.description}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {group.stack.map((s) => (
                  <span key={s} className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 w-full lg:w-80">
              <div className="text-sm font-semibold text-slate-900">Defense Info</div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-slate-500">Type</div>
                  <div className="font-semibold text-slate-800">{group.defense.type}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Room</div>
                  <div className="font-semibold text-slate-800">{group.defense.room}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-slate-500">Schedule</div>
                  <div className="font-semibold text-slate-800">{group.defense.schedule}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-slate-500">Payment</div>
                  <div className="font-semibold text-slate-800">{group.defense.paymentStatus}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button type="button" className={tabButton('overview', 'Overview')} onClick={() => setActiveTab('overview')}>
              Overview
            </button>
            <button type="button" className={tabButton('documents', 'Documents')} onClick={() => setActiveTab('documents')}>
              Documents
            </button>
            <button type="button" className={tabButton('history', 'Evaluation History')} onClick={() => setActiveTab('history')}>
              Evaluation History
            </button>
          </div>
        </motion.section>

        {activeTab === 'overview' ? (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 xl:col-span-2">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-slate-700" />
                <div>
                  <div className="text-lg font-semibold text-slate-900">Group Members</div>
                  <div className="text-sm text-slate-500">Roles and student IDs (dummy).</div>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600">
                      <th className="text-left py-3 font-semibold">Name</th>
                      <th className="text-left py-3 font-semibold">Role</th>
                      <th className="text-left py-3 font-semibold">Student ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {members.map((m) => (
                      <tr key={m.studentId} className="hover:bg-slate-50">
                        <td className="py-3 font-medium text-slate-900">{m.name}</td>
                        <td className="py-3 text-slate-700">{m.role}</td>
                        <td className="py-3 text-slate-700">{m.studentId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="text-lg font-semibold text-slate-900">Panel Information</div>
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <div className="text-xs text-slate-500">Adviser</div>
                  <div className="font-semibold text-slate-800">{group.adviser}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Co-Panel Members</div>
                  <div className="mt-1 space-y-1">
                    {group.coPanelists.map((p) => (
                      <div key={p} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-800">
                        {p}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        ) : null}

        {activeTab === 'documents' ? (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <FolderOpen size={18} className="text-slate-700" />
                <div>
                  <div className="text-lg font-semibold text-slate-900">Uploaded Documents</div>
                  <div className="text-sm text-slate-500">Preview and download (UI only).</div>
                </div>
              </div>
              <a
                href="/panelist/documents"
                className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 text-white px-4 py-2.5 text-sm font-semibold hover:shadow"
              >
                Open review center
              </a>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="text-left py-3 font-semibold">Document</th>
                    <th className="text-left py-3 font-semibold">Type</th>
                    <th className="text-left py-3 font-semibold">Uploaded</th>
                    <th className="text-left py-3 font-semibold">Status</th>
                    <th className="text-right py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="py-3 font-medium text-slate-900">{d.name}</td>
                      <td className="py-3 text-slate-700">{d.type}</td>
                      <td className="py-3 text-slate-700">{d.uploadedAt}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusPill(d.status)}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href="/panelist/documents/viewer"
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                          >
                            Preview
                          </a>
                          <button
                            type="button"
                            onClick={() => alert('UI only: download')}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 inline-flex items-center gap-2"
                          >
                            <Download size={14} />
                            Download
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        ) : null}

        {activeTab === 'history' ? (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-slate-700" />
              <div>
                <div className="text-lg font-semibold text-slate-900">Evaluation History</div>
                <div className="text-sm text-slate-500">Previous defenses and verdicts (dummy).</div>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="text-left py-3 font-semibold">Defense Type</th>
                    <th className="text-left py-3 font-semibold">Date</th>
                    <th className="text-left py-3 font-semibold">Score</th>
                    <th className="text-left py-3 font-semibold">Verdict</th>
                    <th className="text-left py-3 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {evaluationHistory.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50">
                      <td className="py-3 font-medium text-slate-900">{h.defenseType}</td>
                      <td className="py-3 text-slate-700">{h.date}</td>
                      <td className="py-3 text-slate-700">{h.score === null ? '—' : h.score}</td>
                      <td className="py-3 text-slate-700">{h.verdict}</td>
                      <td className="py-3 text-slate-700 max-w-xl">{h.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        ) : null}
      </div>
    </PanelLayout>
  );
};

export default PanelistGroupDetails;
