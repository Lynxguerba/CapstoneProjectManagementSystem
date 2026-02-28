import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MessageSquareText, Star } from 'lucide-react';
import StudentLayout from './_layout';

type ScoreItem = {
    panelist: string;
    score: number;
    comments: string;
    submittedAt: string;
};

const StudentEvaluation = () => {
    const scores: ScoreItem[] = [
        { panelist: 'Prof. Aquino', score: 91, comments: 'Good scope and strong documentation. Improve UI consistency.', submittedAt: '2026-03-25' },
        { panelist: 'Prof. Tan', score: 88, comments: 'Solid features. Add clearer testing evidence.', submittedAt: '2026-03-25' },
        { panelist: 'Prof. Garcia', score: 90, comments: 'Database design is okay. Consider indexing for performance.', submittedAt: '2026-03-26' },
    ];

    const average = useMemo(() => {
        if (scores.length === 0) {
            return 0;
        }

        return Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length);
    }, [scores]);

    return (
        <StudentLayout title="Evaluation & Feedback" subtitle="View-only panel scoring and remarks">
            <div className="space-y-6">
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Score Summary</h3>
                            <p className="mt-1 text-sm text-slate-500">Average computed automatically (dummy).</p>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3">
                            <Star size={18} className="text-indigo-700" />
                            <div className="text-sm font-semibold text-indigo-700">Average: {average}</div>
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    <h3 className="text-lg font-semibold text-slate-900">Panel Member Feedback</h3>
                    <p className="mt-1 text-sm text-slate-500">Students cannot edit these entries.</p>

                    <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                        {scores.map((s) => (
                            <div key={s.panelist} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-sm font-semibold text-slate-900">{s.panelist}</div>
                                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                        Score: {s.score}
                                    </span>
                                </div>
                                <div className="mt-3 flex items-start gap-3">
                                    <MessageSquareText size={16} className="mt-0.5 text-indigo-600" />
                                    <div className="text-sm text-slate-700">{s.comments}</div>
                                </div>
                                <div className="mt-4 text-xs text-slate-500">Submitted: {s.submittedAt}</div>
                            </div>
                        ))}
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    <h3 className="text-lg font-semibold text-slate-900">Timeline (dummy)</h3>
                    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                        {[
                            { date: '2026-03-22', title: 'Defense Completed', note: 'Outline defense concluded.' },
                            { date: '2026-03-25', title: 'Evaluation Submitted', note: 'Panel scores are available.' },
                            { date: '2026-03-28', title: 'Instructor Review', note: 'Verdict will be released soon.' },
                        ].map((t) => (
                            <div key={t.date} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                                <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{t.date}</div>
                                <div className="mt-1 text-sm font-semibold text-slate-900">{t.title}</div>
                                <div className="mt-1 text-sm text-slate-600">{t.note}</div>
                            </div>
                        ))}
                    </div>
                </motion.section>
            </div>
        </StudentLayout>
    );
};

export default StudentEvaluation;
