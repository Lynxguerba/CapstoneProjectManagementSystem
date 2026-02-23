import React from 'react';
import DeanLayout from './_layout';

const ProjectDetails = () => {
  return (
    <DeanLayout title="Project Details" subtitle="Full details and administrative actions">
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-start gap-6">
            <div>
              <h3 className="text-xl font-semibold text-slate-800">Smart Attendance with QR + Face Match</h3>
              <p className="text-sm text-slate-500">Group 2 — Prof. Reyes — Computer Science</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => alert('UI only: mark as reviewed')} className="px-4 py-2 rounded-xl bg-slate-900 text-white">
                Mark Reviewed
              </button>
              <button onClick={() => alert('UI only: archive project')} className="px-4 py-2 rounded-xl bg-white border">
                Archive
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-700">Abstract</h4>
              <p className="text-sm text-slate-600 mt-2">This project aims to combine QR-based attendance with an optional face-match layer to reduce proxy attendance and automate logs.</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700">Team Members</h4>
              <ul className="mt-2 text-sm text-slate-600 space-y-1">
                <li>Juan Dela Cruz — Team Lead</li>
                <li>Maria Santos — Frontend</li>
                <li>Carlos Reyes — Backend</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h4 className="text-sm font-semibold text-slate-700">Files & Evidence</h4>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg text-sm text-slate-700">Proposal.pdf</div>
            <div className="p-4 border rounded-lg text-sm text-slate-700">DesignDocs.zip</div>
            <div className="p-4 border rounded-lg text-sm text-slate-700">Presentation.pptx</div>
          </div>
        </div>
      </div>
    </DeanLayout>
  );
};

export default ProjectDetails;
