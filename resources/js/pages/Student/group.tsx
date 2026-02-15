import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, CreditCard, Crown, Mail, Shield, UserPlus, Users } from 'lucide-react';
import StudentLayout from './_layout';

type GroupMember = {
  name: string;
  role: 'Project Manager / Analyst' | 'Programmer' | 'Documentarian';
  email: string;
};

type PanelMember = {
  name: string;
  area: string;
};

const StudentGroup = () => {
  const [inviteEmail, setInviteEmail] = useState('');

  const group = {
    name: 'Lynx Tech Innovators',
    section: 'BSIT 4A',
    adviser: 'Prof. Maria Cruz',
    paymentStatus: 'Verified',
  };

  const members: GroupMember[] = [
    { name: 'Juan Dela Cruz', role: 'Project Manager / Analyst', email: 'juan@student.edu' },
    { name: 'Ana Santos', role: 'Programmer', email: 'ana@student.edu' },
    { name: 'Carlo Reyes', role: 'Programmer', email: 'carlo@student.edu' },
    { name: 'Mia Lopez', role: 'Documentarian', email: 'mia@student.edu' },
  ];

  const panel: PanelMember[] = [
    { name: 'Prof. L. Aquino', area: 'Systems Analysis' },
    { name: 'Prof. R. Tan', area: 'Software Engineering' },
    { name: 'Prof. J. Garcia', area: 'Database' },
  ];

  const progress = useMemo(() => {
    return [
      { label: 'Concept Submitted', done: true },
      { label: 'Concept Approved', done: true },
      { label: 'Outline Defense', done: false },
      { label: 'Pre-Deployment', done: false },
      { label: 'Deployment', done: false },
    ];
  }, []);

  const roleMeta: Record<GroupMember['role'], { icon: React.ComponentType<{ size?: number; className?: string }>; tone: string }> = {
    'Project Manager / Analyst': { icon: Crown, tone: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    Programmer: { icon: Shield, tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    Documentarian: { icon: BadgeCheck, tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  };

  return (
    <StudentLayout title="My Capstone Group" subtitle="Group details, members, and progress">
      <div className="space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                <Users size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{group.name}</h3>
                <div className="mt-1 text-sm text-slate-600">Section: {group.section}</div>
                <div className="mt-1 text-sm text-slate-600">Adviser: {group.adviser}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                <CreditCard size={16} className="text-slate-600" />
                <div className="text-sm font-semibold text-slate-800">Payment: {group.paymentStatus}</div>
              </div>
              <button
                type="button"
                onClick={() => alert('UI only: open invite/join settings')}
                className="rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 text-white px-4 py-2.5 text-sm font-semibold hover:shadow-lg"
              >
                Manage group
              </button>
            </div>
          </div>
        </motion.section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">Members</h3>
              <span className="text-xs font-semibold text-slate-600 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                {members.length} total
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {members.map((m) => {
                const meta = roleMeta[m.role];
                const Icon = meta.icon;

                return (
                  <div
                    key={m.email}
                    className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">{m.name}</div>
                        <div className="mt-1 inline-flex items-center gap-2 text-sm text-slate-600">
                          <Mail size={14} />
                          <span className="truncate">{m.email}</span>
                        </div>
                      </div>

                      <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${meta.tone}`}>
                        <Icon size={14} />
                        {m.role}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-slate-900">Invite / Join (UI only)</h3>
            <p className="text-sm text-slate-500 mt-1">Send an invitation link to a classmate.</p>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="student@email.com"
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => {
                  alert(`UI only: invite sent to ${inviteEmail || '(empty email)'}`);
                  setInviteEmail('');
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-3 text-sm font-semibold hover:bg-indigo-700"
              >
                <UserPlus size={16} />
                Invite
              </button>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <h4 className="text-sm font-semibold text-slate-800">Group Progress</h4>
              <div className="mt-3 space-y-2">
                {progress.map((p) => (
                  <div key={p.label} className="flex items-center justify-between gap-3">
                    <div className="text-sm text-slate-700">{p.label}</div>
                    <span
                      className={`text-xs font-semibold rounded-full border px-3 py-1 ${p.done
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                    >
                      {p.done ? 'Done' : 'Next'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-slate-900">Panel Members (once assigned)</h3>
          <p className="text-sm text-slate-500 mt-1">Displayed for transparency. View-only.</p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {panel.map((p) => (
              <div
                key={p.name}
                className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4"
              >
                <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                <div className="mt-1 text-sm text-slate-600">{p.area}</div>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </StudentLayout>
  );
};

export default StudentGroup;
