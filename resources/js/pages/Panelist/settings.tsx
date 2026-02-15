import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Shield, User } from 'lucide-react';
import PanelLayout from './_layout';

const PanelistSettings = () => {
  const [fullName, setFullName] = useState('Prof. Panelist User');
  const [employeeId, setEmployeeId] = useState('EMP-2026-001');
  const [department, setDepartment] = useState('IT Department');
  const [email, setEmail] = useState('panelist@example.com');
  const [specialization, setSpecialization] = useState('Software Engineering');

  const [emailDefenseReminders, setEmailDefenseReminders] = useState(true);
  const [emailAssignments, setEmailAssignments] = useState(true);
  const [emailDocumentUploads, setEmailDocumentUploads] = useState(false);
  const [emailDeadlines, setEmailDeadlines] = useState(true);

  return (
    <PanelLayout title="Profile & Settings" subtitle="Account settings (UI only)">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2">
            <User size={18} className="text-slate-700" />
            <div>
              <div className="text-lg font-semibold text-slate-900">Profile Information</div>
              <div className="text-sm text-slate-500">Editable fields with dummy values.</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600">Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Employee ID</label>
              <input
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Department / Position</label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Email</label>
              <div className="relative mt-2">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-600">Specialization / Expertise Areas</label>
              <input
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => alert('UI only: save profile')}
              className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 text-white px-4 py-2.5 text-sm font-semibold hover:shadow"
            >
              Save changes
            </button>
            <button
              type="button"
              onClick={() => alert('UI only: reset')}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-slate-700" />
            <div>
              <div className="text-lg font-semibold text-slate-900">Preferences</div>
              <div className="text-sm text-slate-500">Email notification toggles (dummy).</div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {[
              { label: 'Defense reminders', value: emailDefenseReminders, set: setEmailDefenseReminders },
              { label: 'New assignments', value: emailAssignments, set: setEmailAssignments },
              { label: 'Document uploads', value: emailDocumentUploads, set: setEmailDocumentUploads },
              { label: 'Deadline alerts', value: emailDeadlines, set: setEmailDeadlines },
            ].map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => t.set(!t.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-3 flex items-center justify-between"
              >
                <div className="text-sm font-semibold text-slate-900">{t.label}</div>
                <div
                  className={`h-6 w-11 rounded-full p-1 transition-colors ${t.value ? 'bg-emerald-600' : 'bg-slate-300'}`}
                >
                  <div className={`h-4 w-4 rounded-full bg-white transition-transform ${t.value ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => alert('UI only: change password')}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Change password
            </button>
          </div>
        </motion.section>
      </div>
    </PanelLayout>
  );
};

export default PanelistSettings;
