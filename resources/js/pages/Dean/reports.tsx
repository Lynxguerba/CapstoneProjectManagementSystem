import React, { useState } from 'react';
import DeanLayout from './_layout';

const DeanReports = () => {
    const [department, setDepartment] = useState('all');

    return (
        <DeanLayout title="Reports" subtitle="Generate administrative reports and summaries">
            <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800">Report Center</h3>
                    <p className="text-sm text-slate-500">Create exportable summaries for projects, students and evaluators.</p>

                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <select value={department} onChange={(e) => setDepartment(e.target.value)} className="rounded-xl border px-4 py-2">
                            <option value="all">All Departments</option>
                            <option value="cs">Computer Science</option>
                            <option value="is">Information Systems</option>
                        </select>

                        <button onClick={() => alert('UI only: generate projects summary')} className="rounded-xl bg-slate-900 px-4 py-2 text-white">
                            Projects Summary
                        </button>
                        <button onClick={() => alert('UI only: generate student assignments')} className="rounded-xl border bg-white px-4 py-2">
                            Student Assignments
                        </button>
                    </div>
                </div>
            </div>
        </DeanLayout>
    );
};

export default DeanReports;
