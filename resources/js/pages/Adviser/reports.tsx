import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp } from 'lucide-react';
import AdviserLayout from './_layout';

const AdviserReports = () => {
  const metrics = [
    { label: 'Group Progress Summary', value: 72, tone: 'from-indigo-500 to-violet-500' },
    { label: 'Concept Approval Rate', value: 63, tone: 'from-emerald-500 to-teal-500' },
    { label: 'Defense Outcomes', value: 81, tone: 'from-slate-800 to-slate-700' },
    { label: 'Revision Frequency', value: 44, tone: 'from-amber-500 to-orange-500' },
    { label: 'Deployment Completion', value: 32, tone: 'from-rose-500 to-pink-500' },
  ];

  return (
    <AdviserLayout title="Reports" subtitle="Monitoring and analytics (UI only)">
      <div className="space-y-6">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-slate-700" />
              <div>
                <div className="text-lg font-semibold text-slate-900">Analytics Snapshot</div>
                <div className="text-sm text-slate-500">High-level indicators (dummy).</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => alert('UI only: export report')}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Export
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{m.label}</div>
                    <div className="mt-2 text-3xl font-bold text-slate-900">{m.value}%</div>
                  </div>
                  <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${m.tone} flex items-center justify-center shadow-sm`}>
                    <TrendingUp size={18} className="text-white" />
                  </div>
                </div>
                <div className="mt-4 h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className={`h-2 rounded-full bg-gradient-to-r ${m.tone}`} style={{ width: `${m.value}%` }} />
                </div>
                <div className="mt-2 text-sm text-slate-600">Dummy KPI trend, not real-time.</div>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </AdviserLayout>
  );
};

export default AdviserReports;
