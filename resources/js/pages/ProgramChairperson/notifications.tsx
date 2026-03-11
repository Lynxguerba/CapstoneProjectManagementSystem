import { motion } from 'framer-motion';
import { Bell, Clock3, FileText, Send } from 'lucide-react';
import React from 'react';

import ProgramChairpersonLayout from './_layout';

type NotificationTone = 'pending' | 'new' | 'update';

type NotificationItem = {
    id: string;
    title: string;
    detail: string;
    date: string;
    tone: NotificationTone;
};

const notifications: NotificationItem[] = [
    {
        id: 'pn-01',
        title: 'Pending letter approvals reached 7 items',
        detail: 'Review pre-deployment letters from Groups Alpha, Delta, and Orion.',
        date: '2026-03-04 10:15',
        tone: 'pending',
    },
    {
        id: 'pn-02',
        title: 'New deployment request submitted by Group Vega',
        detail: 'Security checklist attached and ready for requirement validation.',
        date: '2026-03-04 08:52',
        tone: 'new',
    },
    {
        id: 'pn-03',
        title: 'Post-deployment report updated by Group Alpha',
        detail: 'Added acceptance signatures and revised completion timeline.',
        date: '2026-03-03 17:40',
        tone: 'update',
    },
    {
        id: 'pn-04',
        title: 'Pending official documents require signature verification',
        detail: 'Signed deployment agreement from Group Alpha flagged for review.',
        date: '2026-03-03 14:12',
        tone: 'pending',
    },
];

const toneStyle: Record<NotificationTone, string> = {
    pending: 'border-amber-200 bg-amber-50 text-amber-800',
    new: 'border-sky-200 bg-sky-50 text-sky-800',
    update: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

const NotificationIcon = ({ tone }: { tone: NotificationTone }) => {
    if (tone === 'pending') {
        return <Clock3 size={18} className="text-amber-700" />;
    }

    if (tone === 'new') {
        return <Send size={18} className="text-sky-700" />;
    }

    return <FileText size={18} className="text-emerald-700" />;
};

const ProgramChairpersonNotificationsPage = () => {
    return (
        <ProgramChairpersonLayout title="Notifications" subtitle="Alerts for pending approvals and newly submitted deployment records (UI only)">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Pending Alerts</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900">6</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">New Submissions Today</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900">4</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Resolved Notifications</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900">12</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <Bell size={18} className="text-slate-700" />
                        <h3 className="text-lg font-semibold text-slate-900">Approval Alerts Feed</h3>
                    </div>

                    <div className="space-y-3">
                        {notifications.map((item) => (
                            <div key={item.id} className={`rounded-2xl border p-4 ${toneStyle[item.tone]}`}>
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5">
                                            <NotificationIcon tone={item.tone} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">{item.title}</p>
                                            <p className="mt-1 text-sm">{item.detail}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold">{item.date}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.section>
        </ProgramChairpersonLayout>
    );
};

export default ProgramChairpersonNotificationsPage;
