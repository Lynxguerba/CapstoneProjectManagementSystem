import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { usePage } from '@inertiajs/react';
import InstructorLayout from './_layout';

const SettingsPage = () => {
  const { auth } = usePage().props as any;
  const user = auth?.user;

  const [name, setName] = useState(user?.name ?? 'Instructor');
  const [email, setEmail] = useState(user?.email ?? 'instructor@example.com');
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');

  return (
    <InstructorLayout title="Profile & Settings" subtitle="Account settings (UI only)">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800">Profile</h3>
          <p className="text-sm text-slate-500 mt-1">Updates here do not save (dummy)</p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3 flex-wrap">
            <button
              onClick={() => alert('UI only: saved profile')}
              className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold"
            >
              Save Changes
            </button>
            <button
              onClick={() => alert('UI only: reset password')}
              className="bg-white border border-slate-300 text-slate-800 px-6 py-3 rounded-xl hover:bg-slate-50 transition-all font-semibold"
            >
              Reset Password
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800">Preferences</h3>
          <p className="text-sm text-slate-500 mt-1">UI-only toggles</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className="mt-2 w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white">
              <div className="text-sm font-semibold text-slate-800">Notifications</div>
              <div className="mt-2 text-sm text-slate-600">Enable alerts for deadlines, evaluations, and payments.</div>
              <button
                onClick={() => alert('UI only: toggled notifications')}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition"
              >
                Toggle
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </InstructorLayout>
  );
};

export default SettingsPage;
