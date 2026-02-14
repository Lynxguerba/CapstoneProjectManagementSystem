import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import InstructorLayout from './_layout';

type GroupInfo = {
  group: string;
  title: string;
  members: string[];
  adviser: string;
  panel: string[];
  verdict: 'Approved' | 'Re-Defense';
};

const MinutesPage = () => {
  const groups: GroupInfo[] = [
    {
      group: 'Group 1',
      title: 'Capstone Projects Management System',
      members: ['Juan Dela Cruz (PM)', 'Maria Santos (Analyst)', 'Carlo Reyes (Programmer)', 'Ana Lim (Docu)'],
      adviser: 'Prof. Cruz',
      panel: ['Prof. A', 'Prof. B', 'Prof. C'],
      verdict: 'Re-Defense',
    },
    {
      group: 'Group 2',
      title: 'Smart Attendance with QR + Face Match',
      members: ['Mark Lee (PM)', 'Lea Tan (Analyst)', 'John Uy (Programmer)', 'Kate Go (Docu)'],
      adviser: 'Prof. Reyes',
      panel: ['Prof. D', 'Prof. E', 'Prof. F'],
      verdict: 'Approved',
    },
  ];

  const [selected, setSelected] = useState(groups[0]?.group ?? '');
  const info = useMemo(() => groups.find((g) => g.group === selected) ?? groups[0], [groups, selected]);

  return (
    <InstructorLayout title="Minutes & Approval Sheet" subtitle="Generate official documents (UI only)">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Generator</h3>
                <p className="text-sm text-slate-500">Auto-filled form preview</p>
              </div>

              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              >
                {groups.map((g) => (
                  <option key={g.group} value={g.group}>
                    {g.group}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50">
                <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Title</div>
                <div className="mt-2 text-sm font-semibold text-slate-800">{info.title}</div>
              </div>
              <div className="p-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50">
                <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Verdict</div>
                <div className="mt-2 text-sm font-semibold text-slate-800">{info.verdict}</div>
              </div>
              <div className="p-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50">
                <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Adviser</div>
                <div className="mt-2 text-sm font-semibold text-slate-800">{info.adviser}</div>
              </div>
              <div className="p-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50">
                <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Panel</div>
                <div className="mt-2 text-sm font-semibold text-slate-800">{info.panel.join(', ')}</div>
              </div>
            </div>

            <div className="mt-6 p-6 rounded-2xl border border-slate-200 bg-white">
              <div className="text-sm font-semibold text-slate-800">Members</div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                {info.members.map((m) => (
                  <div key={m} className="text-sm text-slate-600">{m}</div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex gap-3 flex-wrap">
              <button
                onClick={() => alert('UI only: generate Minutes PDF')}
                className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold"
              >
                Generate Minutes PDF
              </button>
              <button
                onClick={() => alert('UI only: generate Approval Sheet PDF')}
                className="bg-white border border-slate-300 text-slate-800 px-6 py-3 rounded-xl hover:bg-slate-50 transition-all font-semibold"
              >
                Generate Approval Sheet PDF
              </button>
              <button
                onClick={() => alert('UI only: download & archive')}
                className="bg-white border border-slate-300 text-slate-800 px-6 py-3 rounded-xl hover:bg-slate-50 transition-all font-semibold"
              >
                Download & Archive
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800">Digital Signature Preview</h3>
            <p className="text-sm text-slate-500 mt-1">UI placeholder only</p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Instructor', 'Adviser', 'Panel Chair'].map((role) => (
                <div key={role} className="p-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                  <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{role}</div>
                  <div className="mt-6 h-16 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-500">
                    Signature Placeholder
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800">Archive Queue</h3>
          <p className="text-sm text-slate-500 mt-1">Recently generated documents</p>

          <div className="mt-6 space-y-3">
            {[{ name: 'Minutes - Group 2.pdf', at: '2026-03-20 11:20' }, { name: 'Approval Sheet - Group 1.pdf', at: '2026-03-19 09:10' }].map((x) => (
              <div key={x.name} className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                <div className="text-sm font-semibold text-slate-800">{x.name}</div>
                <div className="mt-1 text-xs text-slate-500">Generated at {x.at}</div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => alert('UI only: download')}
                    className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => alert('UI only: mark archived')}
                    className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-semibold hover:bg-slate-50 transition"
                  >
                    Archive
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </InstructorLayout>
  );
};

export default MinutesPage;
