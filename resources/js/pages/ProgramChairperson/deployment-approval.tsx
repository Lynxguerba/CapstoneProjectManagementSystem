import { motion } from 'framer-motion';
import { CheckSquare, Send, ShieldCheck } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import ProgramChairpersonLayout from './_layout';

type RequestStatus = 'Pending Validation' | 'Approved' | 'Denied';

type DeploymentRequest = {
    id: string;
    group: string;
    project: string;
    requestedAt: string;
    status: RequestStatus;
    requirements: Array<{ label: string; done: boolean }>;
};

const statusBadge: Record<RequestStatus, string> = {
    'Pending Validation': 'border-amber-200 bg-amber-50 text-amber-700',
    Approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Denied: 'border-rose-200 bg-rose-50 text-rose-700',
};

const requests: DeploymentRequest[] = [
    {
        id: 'dr-01',
        group: 'Group Alpha',
        project: 'Barangay Incident Reporting System',
        requestedAt: '2026-03-04',
        status: 'Pending Validation',
        requirements: [
            { label: 'Approved pre-deployment letter', done: true },
            { label: 'Security checklist complete', done: true },
            { label: 'Partner endorsement signed', done: false },
            { label: 'Rollback plan attached', done: true },
        ],
    },
    {
        id: 'dr-02',
        group: 'Group Delta',
        project: 'School Inventory and Forecasting System',
        requestedAt: '2026-03-02',
        status: 'Pending Validation',
        requirements: [
            { label: 'Approved pre-deployment letter', done: true },
            { label: 'Security checklist complete', done: false },
            { label: 'Partner endorsement signed', done: true },
            { label: 'Rollback plan attached', done: true },
        ],
    },
    {
        id: 'dr-03',
        group: 'Group Sigma',
        project: 'Clinic Queue Management System',
        requestedAt: '2026-02-27',
        status: 'Approved',
        requirements: [
            { label: 'Approved pre-deployment letter', done: true },
            { label: 'Security checklist complete', done: true },
            { label: 'Partner endorsement signed', done: true },
            { label: 'Rollback plan attached', done: true },
        ],
    },
];

const DeploymentApprovalPage = () => {
    const [selectedId, setSelectedId] = useState<string | null>(requests[0]?.id ?? null);

    const selectedRequest = useMemo(() => requests.find((row) => row.id === selectedId) ?? null, [selectedId]);

    return (
        <ProgramChairpersonLayout title="Deployment Approval" subtitle="Validate deployment requirements and decide requests (UI only)">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    <div className="flex items-center gap-2">
                        <Send size={18} className="text-slate-700" />
                        <h3 className="text-lg font-semibold text-slate-900">Request Queue</h3>
                    </div>

                    <div className="mt-4 space-y-3">
                        {requests.map((request) => {
                            const active = request.id === selectedId;

                            return (
                                <button
                                    key={request.id}
                                    type="button"
                                    onClick={() => setSelectedId(request.id)}
                                    className={`w-full rounded-2xl border p-4 text-left transition-colors ${active ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                                >
                                    <p className="text-sm font-semibold text-slate-900">{request.group}</p>
                                    <p className="mt-1 text-xs text-slate-600">{request.project}</p>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-xs text-slate-500">{request.requestedAt}</span>
                                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadge[request.status]}`}>
                                            {request.status}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2"
                >
                    {!selectedRequest ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                            <p className="text-base font-semibold text-slate-800">Select a deployment request to validate.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Deployment Request</p>
                                    <h3 className="mt-1 text-2xl font-bold text-slate-900">{selectedRequest.group}</h3>
                                    <p className="mt-1 text-sm text-slate-600">{selectedRequest.project}</p>
                                </div>
                                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge[selectedRequest.status]}`}>
                                    {selectedRequest.status}
                                </span>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={16} className="text-slate-700" />
                                    <p className="text-sm font-semibold text-slate-900">Requirement Validation Checklist</p>
                                </div>

                                <div className="mt-3 space-y-2">
                                    {selectedRequest.requirements.map((requirement) => (
                                        <div
                                            key={requirement.label}
                                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                                        >
                                            <span className="text-slate-700">{requirement.label}</span>
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${requirement.done ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}
                                            >
                                                {requirement.done ? 'Complete' : 'Missing'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                <div className="flex items-center gap-2">
                                    <CheckSquare size={16} className="text-slate-700" />
                                    <p className="text-sm font-semibold text-slate-900">Decision Actions</p>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => alert('UI only: approve deployment')}
                                        className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                                    >
                                        Approve Deployment
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => alert('UI only: deny deployment')}
                                        className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
                                    >
                                        Deny Request
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.section>
            </div>
        </ProgramChairpersonLayout>
    );
};

export default DeploymentApprovalPage;
