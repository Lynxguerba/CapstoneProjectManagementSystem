import { CreditCard, Download, Eye } from 'lucide-react';
import React from 'react';

type PaymentMember = {
    initials: string;
    color: string;
};

type PaymentRow = {
    id: string;
    group: string;
    members: PaymentMember[];
    submittedAt: string;
    status: 'Verified' | 'Pending' | 'Not Paid';
};

type PaymentsTabProps = {
    payments: PaymentRow[];
    pagedPayments: PaymentRow[];
    pageStart: number;
    perPage: number;
    page: number;
    totalPages: number;
    filters: React.ReactNode;
    paymentBadge: (status: PaymentRow['status']) => string;
    onPrevPage: () => void;
    onNextPage: () => void;
};

const PaymentsTab = ({
    payments,
    pagedPayments,
    pageStart,
    perPage,
    page,
    totalPages,
    filters,
    paymentBadge,
    onPrevPage,
    onNextPage,
}: PaymentsTabProps) => {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
                <div>
                    <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-emerald-600" />
                        <h3 className="text-sm font-semibold text-slate-900">Payment Verification</h3>
                    </div>
                    <p className="text-xs text-slate-500">Review and approve group payment submissions</p>
                </div>
                <button
                    type="button"
                    onClick={() => alert('UI only: export payments')}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                    <Download className="h-4 w-4" />
                    Export
                </button>
            </div>
            <div className="border-b border-slate-100 px-6 py-4">{filters}</div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                        <tr>
                            <th className="px-6 py-3 text-left">Group</th>
                            <th className="px-6 py-3 text-left">Members</th>
                            <th className="px-6 py-3 text-left">Submitted</th>
                            <th className="px-6 py-3 text-left">Status</th>
                            <th className="px-6 py-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {payments.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                                    No payment activity found for the current filters.
                                </td>
                            </tr>
                        ) : (
                            pagedPayments.map((row) => (
                                <tr key={row.id} className="text-slate-600 transition-colors hover:bg-emerald-50/40">
                                    <td className="px-6 py-3 font-semibold text-slate-900">{row.group}</td>
                                    <td className="px-6 py-3">
                                        <div className="flex -space-x-2">
                                            {row.members.map((member, index) => (
                                                <div
                                                    key={`${row.id}-${member.initials}-${index}`}
                                                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white ${member.color}`}
                                                >
                                                    {member.initials}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-xs text-slate-500">{row.submittedAt}</td>
                                    <td className="px-6 py-3">
                                        <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${paymentBadge(row.status)}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        {row.status === 'Pending' ? (
                                            <div className="flex gap-2">
                                                <button className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-100">
                                                    Approve
                                                </button>
                                                <button className="rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100">
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <button className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100">
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 text-xs text-slate-500">
                <span>
                    {payments.length === 0
                        ? 'No payments to paginate'
                        : `Showing ${pageStart + 1}–${Math.min(pageStart + perPage, payments.length)} of ${payments.length}`}
                </span>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onPrevPage}
                        disabled={page === 1}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-[11px] text-slate-500">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        type="button"
                        onClick={onNextPage}
                        disabled={page === totalPages}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentsTab;
