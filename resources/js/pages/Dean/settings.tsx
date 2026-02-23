import React, { useState } from 'react';
import DeanLayout from './_layout';

const DeanSettings = () => {
  const [name, setName] = useState('Dean Example');
  const [email, setEmail] = useState('dean@example.edu');

  return (
    <DeanLayout title="Settings" subtitle="Manage your Dean profile and preferences">
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl">
          <h3 className="text-lg font-semibold text-slate-800">Profile</h3>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <label className="text-sm text-slate-700">Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="border rounded-xl px-4 py-2" />

            <label className="text-sm text-slate-700">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="border rounded-xl px-4 py-2" />

            <div className="pt-2">
              <button onClick={() => alert('UI only: save profile')} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Save</button>
            </div>
          </div>
        </div>
      </div>
    </DeanLayout>
  );
};

export default DeanSettings;
