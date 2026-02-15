import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, ShieldCheck } from 'lucide-react';
import AdviserLayout from './_layout';

const AdviserVerdict = () => {
  const [remarks, setRemarks] = useState('');

  const breakdown = [
    { label: 'System Functionality', score: 88 },
    { label: 'Documentation', score: 84 },
    { label: 'Presentation', score: 90 },
    { label: 'Innovation', score: 79 },
  ];

  const finalDecision = 'Approved';

  return (
    <AdviserLayout title="Verdict" subtitle="View consolidated panel verdict (UI only)">
      <div className="space-y-6">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Scale size={18} className="text-slate-700" />
              <div>
                <div className="text-lg font-semibold text-slate-900">Final Decision</div>
                <div className="text-sm text-slate-500">Panel verdict and breakdown (dummy).</div>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              {finalDecision}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-sm font-semibold text-slate-900">Evaluation Breakdown</div>
              <div className="mt-4 space-y-4">
                {breakdown.map((b) => (
                  <div key={b.label}>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-800">{b.label}</div>
                      <div className="text-sm font-bold text-slate-900">{b.score}%</div>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${b.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-slate-700" />
                <div className="text-sm font-semibold text-slate-900">Adviser Acknowledgement</div>
              </div>
              <div className="mt-2 text-sm text-slate-600">Add remarks and acknowledge the decision (UI only).</div>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add adviser remarks..."
                className="mt-4 h-32 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => alert('UI only: acknowledge verdict')}
                className="mt-4 w-full rounded-xl bg-slate-900 text-white px-4 py-3 text-sm font-semibold hover:bg-slate-800"
              >
                Acknowledge
              </button>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                <div className="text-sm font-semibold text-slate-900">Status</div>
                <div className="mt-1 text-sm text-slate-600">Waiting for backend approval sheet signing flow.</div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </AdviserLayout>
  );
};

export default AdviserVerdict;
