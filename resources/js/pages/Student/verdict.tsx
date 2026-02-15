import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, RotateCcw, ShieldCheck } from 'lucide-react';
import StudentLayout from './_layout';

type Verdict = 'Approved' | 'Re-Defense Required';

const StudentVerdict = () => {
  const [verdict] = useState<Verdict>('Re-Defense Required');

  const scoreSummary = [
    { label: 'Average Score', value: '89' },
    { label: 'Documentation', value: '90' },
    { label: 'System Functionality', value: '87' },
    { label: 'Presentation', value: '90' },
  ];

  const revisions = [
    'Improve the UI consistency across core pages.',
    'Add proper test evidence (screenshots/logs) for key flows.',
    'Optimize database queries for listing pages.',
  ];

  return (
    <StudentLayout title="Verdict Results" subtitle="Official decision transparency (UI only)">
      <div className="space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Final Verdict</div>
              <div className="mt-2 flex items-center gap-3">
                {verdict === 'Approved' ? (
                  <ShieldCheck size={22} className="text-emerald-600" />
                ) : (
                  <RotateCcw size={22} className="text-amber-600" />
                )}
                <div className="text-2xl font-bold text-slate-900">{verdict}</div>
              </div>
              <div className="mt-2 text-sm text-slate-600">This is displayed after evaluation is finalized by instructor.</div>
            </div>

            <button
              type="button"
              onClick={() => alert('UI only: download evaluation summary pdf')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-800"
            >
              <Download size={16} />
              Download PDF
            </button>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-slate-700" />
              <h3 className="text-lg font-semibold text-slate-900">Consolidated Score Summary</h3>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {scoreSummary.map((s) => (
                <div key={s.label} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
                  <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{s.label}</div>
                  <div className="mt-2 text-3xl font-bold text-slate-900">{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900">Required Revisions</h3>
            <p className="text-sm text-slate-500 mt-1">Shown when re-defense is required.</p>

            <div className="mt-5 space-y-3">
              {revisions.map((r) => (
                <div key={r} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-sm">
                  {r}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => alert('UI only: open resubmission checklist')}
              className="mt-5 w-full rounded-xl bg-amber-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-amber-700"
            >
              View checklist
            </button>
          </div>
        </motion.section>
      </div>
    </StudentLayout>
  );
};

export default StudentVerdict;
