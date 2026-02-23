import React, { useState } from 'react';
import DeanLayout from './_layout';

const DeanReports = () => {
  const [department, setDepartment] = useState('all');

  return (
    <DeanLayout title="Reports" subtitle="Generate administrative reports and summaries">
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800">Report Center</h3>
          <p className="text-sm text-slate-500">Create exportable summaries for projects, students and evaluators.</p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className="border rounded-xl px-4 py-2">
              <option value="all">All Departments</option>
              <option value="cs">Computer Science</option>
              <option value="is">Information Systems</option>
            </select>

            <button onClick={() => alert('UI only: generate projects summary') } className="px-4 py-2 rounded-xl bg-slate-900 text-white">Projects Summary</button>
            <button onClick={() => alert('UI only: generate student assignments') } className="px-4 py-2 rounded-xl bg-white border">Student Assignments</button>
          </div>
        </div>
      </div>
    </DeanLayout>
  );
};

export default DeanReports;
