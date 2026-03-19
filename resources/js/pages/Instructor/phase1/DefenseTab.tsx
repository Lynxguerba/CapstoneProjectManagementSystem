import { AlertCircle, Eye, ShieldCheck } from 'lucide-react';
import React from 'react';

type DefenseRow = {
    id: string;
    group: string;
    programSet: string;
    scheduleDate: string;
    scheduleTime: string;
    room: string;
    status: string;
};

type DefenseTabProps = {
    rows: DefenseRow[];
    pagedRows: DefenseRow[];
    pageStart: number;
    perPage: number;
    page: number;
    totalPages: number;
    filters: React.ReactNode;
    defenseBadge: (status: string) => string;
    onPrevPage: () => void;
    onNextPage: () => void;
};

const DefenseTab = ({
    rows,
    pagedRows,
    pageStart,
    perPage,
    page,
    totalPages,
    filters,
    defenseBadge,
    onPrevPage,
    onNextPage,
}: DefenseTabProps) => {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
                <div>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <h3 className="text-sm font-semibold text-slate-900">Defense Status</h3>
                    </div>
                    <p className="text-xs text-slate-500">Monitor concept defense schedules by group</p>
                </div>
            </div>
            <div className="border-b border-slate-100 px-6 py-4">{filters}</div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <tr>
                            <th className="px-6 py-3 text-left">Group</th>
                            <th className="px-6 py-3 text-left">Program Set</th>
                            <th className="px-6 py-3 text-left">Schedule</th>
                            <th className="px-6 py-3 text-left">Room</th>
                            <th className="px-6 py-3 text-left">Status</th>
                            <th className="px-6 py-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                                    No groups found for the selected filters.
                                </td>
                            </tr>
                        ) : (
                            pagedRows.map((row) => (
                                <tr key={row.id} className="text-slate-600 transition-colors hover:bg-emerald-50/40">
                                    <td className="px-6 py-3 font-semibold text-slate-900">{row.group}</td>
                                    <td className="px-6 py-3 text-xs text-slate-500">{row.programSet}</td>
                                    <td className="px-6 py-3">
                                        <div className="text-xs font-semibold text-slate-700">{row.scheduleDate}</div>
                                        <div className="text-[11px] text-slate-500">{row.scheduleTime}</div>
                                    </td>
                                    <td className="px-6 py-3 text-xs text-slate-500">{row.room}</td>
                                    <td className="px-6 py-3">
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold ${defenseBadge(
                                                row.status,
                                            )}`}
                                        >
                                            {row.status === 'Missing Requirements' ? <AlertCircle className="h-3.5 w-3.5" /> : null}
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <button className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100">
                                            <Eye className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 text-xs text-slate-500">
                <span>
                    {rows.length === 0
                        ? 'No groups to paginate'
                        : `Showing ${pageStart + 1}–${Math.min(pageStart + perPage, rows.length)} of ${rows.length}`}
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

export default DefenseTab;
