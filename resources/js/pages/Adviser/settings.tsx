import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Settings, User } from 'lucide-react';
import AdviserLayout from './_layout';

const AdviserSettings = () => {
  const [name, setName] = useState('Adviser (Dummy)');
  const [email, setEmail] = useState('adviser@example.com');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  return (
    <AdviserLayout title="Settings" subtitle="Profile and preferences (UI only)">
      <div className="space-y-6">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-slate-700" />
            <div>
              <div className="text-lg font-semibold text-slate-900">Account Settings</div>
              <div className="text-sm text-slate-500">UI only. Changes are not saved.</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2">
                <User size={18} className="text-slate-700" />
                <div className="text-sm font-semibold text-slate-900">Profile</div>
              </div>

              <label className="mt-4 block text-sm font-semibold text-slate-700">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />

              <label className="mt-4 block text-sm font-semibold text-slate-700">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />

              <button
                type="button"
                onClick={() => alert('UI only: save profile')}
                className="mt-4 w-full rounded-xl bg-slate-900 text-white px-4 py-3 text-sm font-semibold hover:bg-slate-800"
              >
                Save profile
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-slate-700" />
                <div className="text-sm font-semibold text-slate-900">Change Password</div>
              </div>

              <label className="mt-4 block text-sm font-semibold text-slate-700">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />

              <label className="mt-4 block text-sm font-semibold text-slate-700">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />

              <button
                type="button"
                onClick={() => alert('UI only: update password')}
                className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Update password
              </button>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                <div className="text-sm font-semibold text-slate-900">Notification Preferences</div>
                <div className="mt-2 space-y-3">
                  {[
                    { id: 'pref1', label: 'Email alerts' },
                    { id: 'pref2', label: 'In-app notifications' },
                    { id: 'pref3', label: 'Deadline reminders' },
                  ].map((p) => (
                    <label key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <span className="text-sm font-semibold text-slate-800">{p.label}</span>
                      <input type="checkbox" defaultChecked className="h-4 w-4" />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </AdviserLayout>
  );
};

export default AdviserSettings;
