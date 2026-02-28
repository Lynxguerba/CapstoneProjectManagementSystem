import React from 'react';
import { useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import AdminLayout from './_layout';

type SystemSettingsData = {
    academicYear: string;
    semester: '1st' | '2nd' | 'summer';
    titleProposalDeadline: string;
    finalDefenseDeadline: string;
    siteWideNotification: string;
};

type AdminSystemSettingsProps = {
    settings?: Partial<SystemSettingsData>;
};

const AdminSystemSettings = ({ settings }: AdminSystemSettingsProps) => {
    const form = useForm<SystemSettingsData>({
        academicYear: settings?.academicYear ?? '',
        semester: settings?.semester ?? '1st',
        titleProposalDeadline: settings?.titleProposalDeadline ?? '',
        finalDefenseDeadline: settings?.finalDefenseDeadline ?? '',
        siteWideNotification: settings?.siteWideNotification ?? '',
    });

    const submitSettings = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.put('/admin/system-settings');
    };

    return (
        <AdminLayout title="System Settings" subtitle="Configure global academic cycles and deadlines">
            <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
                <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-slate-700" />
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Global Configuration</h3>
                        <p className="text-sm text-slate-500">Settings from this page apply system-wide for all roles.</p>
                    </div>
                </div>

                <form onSubmit={submitSettings} className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div>
                        <label className="text-sm font-semibold text-slate-700">Academic year</label>
                        <input
                            value={form.data.academicYear}
                            onChange={(event) => form.setData('academicYear', event.target.value)}
                            placeholder="2025-2026"
                            className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                        />
                        {form.errors.academicYear ? <p className="mt-1 text-xs text-rose-600">{form.errors.academicYear}</p> : null}
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700">Current semester</label>
                        <select
                            value={form.data.semester}
                            onChange={(event) => form.setData('semester', event.target.value as SystemSettingsData['semester'])}
                            className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="1st">1st Semester</option>
                            <option value="2nd">2nd Semester</option>
                            <option value="summer">Summer</option>
                        </select>
                        {form.errors.semester ? <p className="mt-1 text-xs text-rose-600">{form.errors.semester}</p> : null}
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700">Title proposal deadline</label>
                        <input
                            type="date"
                            value={form.data.titleProposalDeadline}
                            onChange={(event) => form.setData('titleProposalDeadline', event.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                        />
                        {form.errors.titleProposalDeadline ? <p className="mt-1 text-xs text-rose-600">{form.errors.titleProposalDeadline}</p> : null}
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700">Final defense deadline</label>
                        <input
                            type="date"
                            value={form.data.finalDefenseDeadline}
                            onChange={(event) => form.setData('finalDefenseDeadline', event.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                        />
                        {form.errors.finalDefenseDeadline ? <p className="mt-1 text-xs text-rose-600">{form.errors.finalDefenseDeadline}</p> : null}
                    </div>

                    <div className="lg:col-span-2">
                        <label className="text-sm font-semibold text-slate-700">Site-wide notification</label>
                        <textarea
                            value={form.data.siteWideNotification}
                            onChange={(event) => form.setData('siteWideNotification', event.target.value)}
                            rows={4}
                            placeholder="Example: System maintenance on Friday 6:00 PM."
                            className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                        />
                        {form.errors.siteWideNotification ? <p className="mt-1 text-xs text-rose-600">{form.errors.siteWideNotification}</p> : null}
                    </div>

                    <div className="lg:col-span-2">
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-5 py-2.5 text-sm font-semibold text-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {form.processing ? 'Saving...' : 'Save settings'}
                        </button>
                    </div>
                </form>
            </motion.section>
        </AdminLayout>
    );
};

export default AdminSystemSettings;
