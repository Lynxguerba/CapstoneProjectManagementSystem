import { usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import React, { useState } from 'react';
import InstructorLayout from './_layout';

const SettingsPage = () => {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    const [name, setName] = useState(user?.name ?? 'Instructor');
    const [email, setEmail] = useState(user?.email ?? 'instructor@example.com');
    const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');

    return (
        <InstructorLayout title="Profile & Settings" subtitle="Account settings (UI only)">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
                    <h3 className="text-lg font-semibold text-slate-800">Profile</h3>
                    <p className="mt-1 text-sm text-slate-500">Updates here do not save (dummy)</p>

                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Full Name</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Email</label>
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <button
                            onClick={() => alert('UI only: saved profile')}
                            className="rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 px-6 py-3 font-semibold text-white transition-all hover:shadow-lg"
                        >
                            Save Changes
                        </button>
                        <button
                            onClick={() => alert('UI only: reset password')}
                            className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800 transition-all hover:bg-slate-50"
                        >
                            Reset Password
                        </button>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800">Preferences</h3>
                    <p className="mt-1 text-sm text-slate-500">UI-only toggles</p>

                    <div className="mt-6 space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Theme</label>
                            <select
                                value={theme}
                                onChange={(e) => setTheme(e.target.value as any)}
                                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="system">System</option>
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                            </select>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                            <div className="text-sm font-semibold text-slate-800">Notifications</div>
                            <div className="mt-2 text-sm text-slate-600">Enable alerts for deadlines, evaluations, and payments.</div>
                            <button
                                onClick={() => alert('UI only: toggled notifications')}
                                className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
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
