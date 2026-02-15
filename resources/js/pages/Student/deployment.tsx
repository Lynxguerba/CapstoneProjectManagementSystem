import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Archive, Link2, Upload } from 'lucide-react';
import StudentLayout from './_layout';

type DeploymentStatus = 'Pending Verification' | 'Verified' | 'Archived';

const StudentDeployment = () => {
  const [status, setStatus] = useState<DeploymentStatus>('Pending Verification');
  const [liveUrl, setLiveUrl] = useState('https://example.com/my-capstone');
  const [repoUrl, setRepoUrl] = useState('https://github.com/example/repo');

  const statusPill = (s: DeploymentStatus): string => {
    if (s === 'Verified') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    if (s === 'Archived') {
      return 'bg-slate-50 text-slate-700 border-slate-200';
    }

    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const isReadOnly = status === 'Archived';

  return (
    <StudentLayout title="Deployment Submission" subtitle="Submit deployed system link & final files (UI only)">
      <div className="space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Submission Status</h3>
              <p className="text-sm text-slate-500 mt-1">Instructor verifies before archiving.</p>
            </div>

            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold ${statusPill(status)}`}>
                {status}
              </span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DeploymentStatus)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option>Pending Verification</option>
                <option>Verified</option>
                <option>Archived</option>
              </select>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-slate-900">Deployment Details</h3>

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Live System URL</label>
              <div className="mt-2 relative">
                <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Git Repository Link (optional)</label>
              <div className="mt-2 relative">
                <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="text-sm font-semibold text-slate-900">Final Manuscript Upload</div>
              <div className="mt-1 text-sm text-slate-600">Upload PDF/DOC (dummy).</div>
              <button
                type="button"
                disabled={isReadOnly}
                onClick={() => alert('UI only: upload final manuscript')}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={16} />
                Choose file
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="text-sm font-semibold text-slate-900">Deployment Evidence</div>
              <div className="mt-1 text-sm text-slate-600">Screenshots (dummy).</div>
              <button
                type="button"
                disabled={isReadOnly}
                onClick={() => alert('UI only: upload screenshots')}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={16} />
                Upload
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => alert('UI only: submit deployment')}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-3 text-sm font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit for verification
            </button>
            <button
              type="button"
              onClick={() => alert('UI only: archive mode info')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              <Archive size={16} />
              What is archived?
            </button>
          </div>
        </motion.section>
      </div>
    </StudentLayout>
  );
};

export default StudentDeployment;
