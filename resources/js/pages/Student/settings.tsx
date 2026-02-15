import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import StudentLayout from './_layout';

const StudentSettings = () => {
  const [name, setName] = useState('Juan Dela Cruz');
  const [email] = useState('juan@student.edu');
  const [program, setProgram] = useState('BSIT');
  const [section, setSection] = useState('BSIT 4A');

  const UserIcon = (LucideIcons as any).User as React.ComponentType<{ size?: number; className?: string }>;
  const KeyRoundIcon = (LucideIcons as any).KeyRound as React.ComponentType<{ size?: number; className?: string }>;
  const ShieldCheckIcon = ((LucideIcons as any).ShieldCheck2 ?? (LucideIcons as any).ShieldCheck ?? (LucideIcons as any).Shield) as React.ComponentType<{
    size?: number;
    className?: string;
  }>;

  return (
    <StudentLayout title="Profile & Settings" subtitle="Account and academic details (UI only)">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          <div className="flex items-center gap-2">
            <UserIcon size={18} className="text-slate-700" />
            <h3 className="text-lg font-semibold text-slate-900">Profile</h3>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Email</label>
              <input
                value={email}
                disabled
                className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Program</label>
              <select
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="BSIT">BSIT</option>
                <option value="BSIS">BSIS</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Section</label>
              <input
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => alert('UI only: save profile')}
              className="rounded-xl bg-indigo-600 text-white px-5 py-3 text-sm font-semibold hover:bg-indigo-700"
            >
              Save changes
            </button>
            <button
              type="button"
              onClick={() => alert('UI only: cancel changes')}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </motion.section>

        <div className="space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
          >
            <div className="flex items-center gap-2">
              <ShieldCheckIcon size={18} className="text-slate-700" />
              <h3 className="text-lg font-semibold text-slate-900">Role</h3>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">Student</div>
              <div className="mt-1 text-sm text-slate-600">Your account is enrolled in a capstone group.</div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
          >
            <div className="flex items-center gap-2">
              <KeyRoundIcon size={18} className="text-slate-700" />
              <h3 className="text-lg font-semibold text-slate-900">Change Password</h3>
            </div>
            <p className="text-sm text-slate-500 mt-1">UI only. Hook validation later.</p>

            <div className="mt-4 space-y-3">
              <input
                type="password"
                placeholder="Current password"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <input
                type="password"
                placeholder="New password"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <button
              type="button"
              onClick={() => alert('UI only: update password')}
              className="mt-4 w-full rounded-xl bg-slate-900 text-white px-5 py-3 text-sm font-semibold hover:bg-slate-800"
            >
              Update password
            </button>
          </motion.section>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentSettings;
