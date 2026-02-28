import React, { useMemo, useState } from 'react';
import DeanLayout from './_layout';

type StudentRow = {
    id: string;
    name: string;
    studentId: string;
    group?: string;
    project?: string;
};

const DeanStudents = () => {
    const [search, setSearch] = useState('');

    const students: StudentRow[] = [
        { id: 's1', name: 'Juan Dela Cruz', studentId: '2021001', group: 'Group 2', project: 'Smart Attendance' },
        { id: 's2', name: 'Maria Santos', studentId: '2021002', group: 'Group 2', project: 'Smart Attendance' },
        { id: 's3', name: 'Carla Reyes', studentId: '2021003' },
    ];

    const filtered = useMemo(() => {
        const s = search.trim().toLowerCase();
        return students.filter((r) => !s || r.name.toLowerCase().includes(s) || r.studentId.includes(s));
    }, [students, search]);

    return (
        <DeanLayout title="Students" subtitle="View students, groups and project assignments">
            <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Students</h3>
                            <p className="text-sm text-slate-500">Student directory and current assignments</p>
                        </div>

                        <div className="flex gap-3">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search student name or ID..."
                                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
                            />
                        </div>
                    </div>

                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-600">
                                    <th className="py-4 text-left font-semibold">Name</th>
                                    <th className="py-4 text-left font-semibold">Student ID</th>
                                    <th className="py-4 text-left font-semibold">Group</th>
                                    <th className="py-4 text-left font-semibold">Project</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((s) => (
                                    <tr key={s.id} className="transition-colors hover:bg-slate-50">
                                        <td className="py-4 font-medium text-slate-800">{s.name}</td>
                                        <td className="py-4 text-slate-600">{s.studentId}</td>
                                        <td className="py-4 text-slate-600">{s.group ?? '-'}</td>
                                        <td className="py-4 text-slate-600">{s.project ?? '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DeanLayout>
    );
};

export default DeanStudents;
