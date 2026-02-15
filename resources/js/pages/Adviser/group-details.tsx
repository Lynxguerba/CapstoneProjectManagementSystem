import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, FileText, FolderOpen, Scale, Users } from 'lucide-react';
import AdviserLayout from './_layout';

type TabKey = 'overview' | 'concepts' | 'documents' | 'evaluation' | 'schedule' | 'verdict';

type Step = {
  label: string;
  status: 'done' | 'current' | 'next';
};

const AdviserGroupDetails = () => {
  const [tab, setTab] = useState<TabKey>('overview');

  const group = {
    name: 'Group Beta',
    members: [
      { name: 'Mark R.', role: 'Project Manager' },
      { name: 'Lea C.', role: 'System Analyst' },
      { name: 'John K.', role: 'Programmer' },
      { name: 'Kate V.', role: 'Documentarian' },
    ],
    panel: 'Panel A (dummy)',
    paymentStatus: 'Verified (dummy)',
  };

  const steps: Step[] = [
    { label: 'Concept Submitted', status: 'done' },
    { label: 'Concept Approved', status: 'done' },
    { label: 'Outline Defense', status: 'current' },
    { label: 'Pre-Oral', status: 'next' },
    { label: 'Final Defense', status: 'next' },
    { label: 'Deployment', status: 'next' },
  ];

  const tabs: Array<{ key: TabKey; label: string; icon: any }> = [
    { key: 'overview', label: 'Overview', icon: Users },
    { key: 'concepts', label: 'Concepts', icon: FileText },
    { key: 'documents', label: 'Documents', icon: FolderOpen },
    { key: 'evaluation', label: 'Evaluation', icon: Scale },
    { key: 'schedule', label: 'Schedule', icon: CalendarClock },
    { key: 'verdict', label: 'Verdict', icon: Scale },
  ];

  const currentStepIndex = useMemo(() => steps.findIndex((s) => s.status === 'current'), [steps]);

  return (
    <AdviserLayout title="Group Details" subtitle="Academic view of a capstone group (UI only)">
      <div className="space-y-6">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Group</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{group.name}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                  Panel: {group.panel}
                </span>
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Payment: {group.paymentStatus}
                </span>
              </div>
            </div>

            <div className="w-full lg:max-w-sm rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
              <div className="text-sm font-semibold text-slate-900">Members</div>
              <div className="mt-3 space-y-2">
                {group.members.map((m) => (
                  <div key={m.name} className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-slate-800 truncate">{m.name}</div>
                    <span className="text-xs font-semibold text-slate-600 rounded-full border border-slate-200 bg-white px-3 py-1 whitespace-nowrap">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-lg font-semibold text-slate-900">Project Status Tracker</div>
              <div className="text-sm text-slate-500 mt-1">Stepper UI based on project phases (dummy).</div>
            </div>
            <span className="text-xs font-semibold text-slate-600 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              Current: {currentStepIndex >= 0 ? steps[currentStepIndex].label : '—'}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-6 gap-3">
            {steps.map((s) => {
              const tone =
                s.status === 'done'
                  ? 'border-emerald-200 bg-emerald-50'
                  : s.status === 'current'
                    ? 'border-indigo-200 bg-indigo-50'
                    : 'border-slate-200 bg-slate-50';

              const dot =
                s.status === 'done'
                  ? 'bg-emerald-600'
                  : s.status === 'current'
                    ? 'bg-indigo-600'
                    : 'bg-slate-400';

              return (
                <div key={s.label} className={`rounded-2xl border p-4 ${tone}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{s.label}</div>
                      <div className="mt-1 text-xs text-slate-600">{s.status.toUpperCase()}</div>
                    </div>
                    <div className={`h-3 w-3 rounded-full mt-1 ${dot}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-lg font-semibold text-slate-900">Workspace</div>
              <div className="text-sm text-slate-500 mt-1">Tabs for concepts, documents, evaluation, schedule, and verdict.</div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {tabs.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${active
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  <t.icon size={16} />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            {tab === 'overview' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
                  <div className="text-sm font-semibold text-slate-900">Documents Overview</div>
                  <div className="mt-2 text-sm text-slate-600">2 submitted • 1 for revision (dummy)</div>
                  <div className="mt-4 space-y-3">
                    {[
                      { name: 'Chapter 1–3 (Outline)', status: 'For Revision' },
                      { name: 'Presentation Slides', status: 'Pending' },
                      { name: 'Revision Notes', status: 'Approved' },
                    ].map((d) => (
                      <div key={d.name} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <div className="text-sm font-medium text-slate-800 truncate">{d.name}</div>
                        <span className="text-xs font-semibold text-slate-600 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 whitespace-nowrap">
                          {d.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-sm font-semibold text-slate-900">Adviser Notes</div>
                  <div className="mt-1 text-sm text-slate-600">Dummy notes for quick reference.</div>
                  <textarea
                    className="mt-4 h-40 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    defaultValue="Focus on scope clarity and testing plan before proceeding to Pre-Oral."
                  />
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => alert('UI only: save notes')}
                      className="rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-800"
                    >
                      Save notes
                    </button>
                    <button
                      type="button"
                      onClick={() => alert('UI only: send message')}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      Message group
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {tab === 'concepts' ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div className="text-sm font-semibold text-slate-900">Concepts (dummy)</div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: 'CPMS with Workflow Automation', status: 'Approved' },
                    { title: 'Smart Queue for Clinic', status: 'Rejected' },
                    { title: 'Repository with Similarity Search', status: 'For Revision' },
                  ].map((c) => (
                    <div key={c.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="text-sm font-semibold text-slate-900 line-clamp-2">{c.title}</div>
                      <div className="mt-3 text-xs font-semibold text-slate-600 rounded-full border border-slate-200 bg-slate-50 inline-flex px-3 py-1">
                        {c.status}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" onClick={() => alert('UI only: approve')} className="rounded-xl bg-emerald-600 text-white px-3.5 py-2 text-xs font-semibold hover:bg-emerald-700">
                          Approve
                        </button>
                        <button type="button" onClick={() => alert('UI only: request revision')} className="rounded-xl bg-amber-500 text-white px-3.5 py-2 text-xs font-semibold hover:bg-amber-600">
                          Revision
                        </button>
                        <button type="button" onClick={() => alert('UI only: reject')} className="rounded-xl bg-rose-600 text-white px-3.5 py-2 text-xs font-semibold hover:bg-rose-700">
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {tab === 'documents' ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div className="text-sm font-semibold text-slate-900">Documents (dummy)</div>
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="text-sm font-semibold text-slate-900">Submitted Files</div>
                    <div className="mt-4 space-y-3">
                      {[
                        { name: 'Chapter 1–3', phase: 'Outline', status: 'For Revision' },
                        { name: 'Slides', phase: 'Outline', status: 'Pending' },
                        { name: 'Revision Log', phase: 'Outline', status: 'Approved' },
                      ].map((d) => (
                        <div key={d.name} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900 truncate">{d.name}</div>
                              <div className="mt-1 text-xs text-slate-500">Phase: {d.phase}</div>
                            </div>
                            <span className="text-xs font-semibold text-slate-600 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 whitespace-nowrap">
                              {d.status}
                            </span>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button type="button" onClick={() => alert('UI only: preview')} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50">
                              Preview
                            </button>
                            <button type="button" onClick={() => alert('UI only: download')} className="rounded-lg bg-slate-900 text-white px-3 py-2 text-xs font-semibold hover:bg-slate-800">
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="text-sm font-semibold text-slate-900">Adviser Comments</div>
                    <div className="mt-1 text-sm text-slate-600">Leave notes and update status (UI only).</div>
                    <textarea className="mt-4 h-40 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Write your feedback..." />
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
                  </div>
                </div>
              </div>
            ) : null}

            {tab === 'evaluation' ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div className="text-sm font-semibold text-slate-900">Evaluation (dummy)</div>
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="text-sm font-semibold text-slate-900">Rubric Scoring</div>
                    <div className="mt-4 space-y-4">
                      {[
                        { label: 'Problem Definition', value: 8 },
                        { label: 'Methodology', value: 7 },
                        { label: 'Documentation Quality', value: 9 },
                        { label: 'Presentation Readiness', value: 6 },
                      ].map((r) => (
                        <div key={r.label}>
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-slate-800">{r.label}</div>
                            <div className="text-sm font-bold text-slate-900">{r.value}/10</div>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${r.value * 10}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="text-sm font-semibold text-slate-900">Recommendation</div>
                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-slate-700">Decision</label>
                      <select className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                        <option>Ready for Defense</option>
                        <option>Needs Revision</option>
                        <option>Recommend Re-Defense</option>
                      </select>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-slate-700">Feedback</label>
                      <textarea className="mt-2 h-32 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Write recommendation notes..." />
                    </div>
                    <button type="button" onClick={() => alert('UI only: submit evaluation')} className="mt-4 w-full rounded-xl bg-slate-900 text-white px-4 py-3 text-sm font-semibold hover:bg-slate-800">
                      Submit evaluation
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {tab === 'schedule' ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div className="text-sm font-semibold text-slate-900">Schedule (dummy)</div>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-sm font-semibold text-slate-900">Next Defense</div>
                  <div className="mt-2 text-sm text-slate-600">2026-03-21 • 9:00 AM • Room 101</div>
                  <button type="button" onClick={() => alert('UI only: open full schedule')} className="mt-4 rounded-xl bg-indigo-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-indigo-700">
                    Open schedule page
                  </button>
                </div>
              </div>
            ) : null}

            {tab === 'verdict' ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div className="text-sm font-semibold text-slate-900">Verdict (dummy)</div>
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="text-sm font-semibold text-slate-900">Final Decision</div>
                    <div className="mt-3 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Approved (dummy)
                    </div>
                    <div className="mt-4 text-sm text-slate-600">Panel remarks will appear here once released.</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="text-sm font-semibold text-slate-900">Adviser Acknowledgement</div>
                    <textarea className="mt-4 h-28 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Add adviser remarks..." />
                    <button type="button" onClick={() => alert('UI only: acknowledge verdict')} className="mt-4 w-full rounded-xl bg-slate-900 text-white px-4 py-3 text-sm font-semibold hover:bg-slate-800">
                      Acknowledge
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </motion.section>
      </div>
    </AdviserLayout>
  );
};

export default AdviserGroupDetails;
