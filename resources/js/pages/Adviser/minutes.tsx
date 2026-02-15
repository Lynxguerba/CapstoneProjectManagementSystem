import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, PenTool, Printer } from 'lucide-react';
import AdviserLayout from './_layout';

const AdviserMinutes = () => {
  const [signature, setSignature] = useState('');
  const [approved, setApproved] = useState(false);

  const minutesText = `Minutes of Meeting (Dummy)\n\nDate: 2026-03-21\nGroup: Group Beta\nTopic: Outline Defense Review\n\nKey Notes:\n- Panel recommended focusing on scope clarity.\n- Adviser requested updated testing plan.\n- Next submission due: 2026-03-25.`;

  return (
    <AdviserLayout title="Minutes" subtitle="Minutes of meeting and approval signing (UI only)">
      <div className="space-y-6">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Printer size={18} className="text-slate-700" />
              <div>
                <div className="text-lg font-semibold text-slate-900">Minutes Preview</div>
                <div className="text-sm text-slate-500">Auto-generated minutes placeholder (dummy).</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => alert('UI only: download PDF')} className="rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-800">
                Download PDF
              </button>
              <button type="button" onClick={() => alert('UI only: print')} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                Print
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <pre className="whitespace-pre-wrap text-sm text-slate-800 font-sans">{minutesText}</pre>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2">
                <PenTool size={18} className="text-slate-700" />
                <div>
                  <div className="text-sm font-semibold text-slate-900">Digital Signature</div>
                  <div className="text-sm text-slate-600">Type your name as signature (dummy).</div>
                </div>
              </div>

              <input
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Your full name"
                className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />

              <button
                type="button"
                disabled={!signature}
                onClick={() => setApproved(true)}
                className="mt-4 w-full rounded-xl bg-emerald-600 text-white px-4 py-3 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Approve minutes
              </button>

              {approved ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 size={16} />
                    <div className="text-sm font-semibold">Approved (dummy)</div>
                  </div>
                  <div className="mt-1 text-sm text-emerald-700">This action will be saved once backend is connected.</div>
                </div>
              ) : null}
            </div>
          </div>
        </motion.section>
      </div>
    </AdviserLayout>
  );
};

export default AdviserMinutes;
