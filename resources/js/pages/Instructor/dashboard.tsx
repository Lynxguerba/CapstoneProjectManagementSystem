import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/sidebar';

interface Member {
  fullName: string;
  program: string;
  set: string;
  year: string;
  role: string;
}

interface Group {
  name: string;
  members: string[];
  status: string;
  color: string;
}

interface Document {
  name: string;
  submitted: string;
  status: string;
  type: string;
}

interface Schedule {
  group: string;
  date: string;
  room: string;
  time: string;
}

type DashboardNotification = {
  id: string;
  title: string;
  message: string;
  date: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
};

const Dashboard = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProgram, setSelectedProgram] = useState('bsit');
  const [selectedPhase, setSelectedPhase] = useState('concept');
  const [isSignoutModalOpen, setIsSignoutModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [newGroupName, setNewGroupName] = useState('');
  const [members, setMembers] = useState<Member[]>([
    { fullName: '', program: 'BSIT', set: '', year: '', role: 'Project Manager' }
  ]);
  const [currentMemberPage, setCurrentMemberPage] = useState(0);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [defenseForm, setDefenseForm] = useState({
    group: '',
    date: '',
    room: '',
    time: ''
  });

  const groupsPerPage = 6;

  const stats = [
    { label: 'Total Groups', value: '28', style: 'from-slate-700 to-slate-900' },
    { label: 'Pending Concepts', value: '9', style: 'from-amber-500 to-amber-600' },
    { label: 'Scheduled Defenses', value: '6', style: 'from-indigo-500 to-indigo-600' },
    { label: 'Re-Defense Cases', value: '3', style: 'from-rose-500 to-rose-600' },
    { label: 'Approved Projects', value: '14', style: 'from-teal-500 to-teal-600' },
  ];

  const upcomingDefenses: Schedule[] = [
    { group: 'Group 2', date: '2026-03-20', room: 'Room 101', time: '9:00 AM - 10:00 AM' },
    { group: 'Group 5', date: '2026-03-21', room: 'Room 102', time: '10:00 AM - 11:00 AM' },
    { group: 'Group 1', date: '2026-03-22', room: 'Room 101', time: '8:00 AM - 9:00 AM' },
  ];

  const dashboardNotifications: DashboardNotification[] = [
    { id: 'n1', title: 'Concept Submitted', message: 'Group 1 submitted a concept paper.', date: '2026-03-12', tone: 'info' },
    { id: 'n2', title: 'Deadline Approaching', message: 'Concept deadline is in 3 days.', date: '2026-03-22', tone: 'warning' },
    { id: 'n3', title: 'Payment Verified', message: 'Payment verified for Group 2.', date: '2026-03-12', tone: 'success' },
    { id: 'n4', title: 'Evaluation Submitted', message: 'Panel evaluation submitted for Group 2.', date: '2026-03-20', tone: 'info' },
  ];

  const approvalTrend = [52, 56, 60, 61, 64, 68, 70];
  const defenseStatus = [
    { label: 'Not Scheduled', value: 14, className: 'from-slate-500 to-slate-600' },
    { label: 'Scheduled', value: 6, className: 'from-indigo-500 to-indigo-600' },
    { label: 'Completed', value: 8, className: 'from-teal-500 to-teal-600' },
    { label: 'Re-Defense', value: 3, className: 'from-rose-500 to-rose-600' },
  ];

  const toneStyles: Record<DashboardNotification['tone'], string> = {
    info: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    success: 'bg-teal-50 border-teal-200 text-teal-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    danger: 'bg-rose-50 border-rose-200 text-rose-700',
  };

  const groups: Group[] = [
    { name: "Group 1", members: ["Juan – PM", "Maria – Analyst", "Carlo – Programmer", "Ana – Documentarian"], status: "Adviser Assigned", color: "bg-teal-100 text-teal-600" },
    { name: "Group 2", members: ["Mark – PM", "Lea – Analyst", "John – Programmer", "Kate – Documentarian"], status: "Adviser Not Assigned", color: "bg-amber-100 text-amber-600" },
    { name: "Group 3", members: ["Luis – PM", "Ella – Analyst", "Ryan – Programmer", "Mia – Documentarian"], status: "Adviser Assigned", color: "bg-teal-100 text-teal-600" },
    { name: "Group 4", members: ["Tom – PM", "Amy – Analyst", "Ken – Programmer", "Lara – Documentarian"], status: "Adviser Not Assigned", color: "bg-amber-100 text-amber-600" },
    { name: "Group 5", members: ["James – PM", "Sofia – Analyst", "Eric – Programmer", "Nina – Documentarian"], status: "Adviser Assigned", color: "bg-teal-100 text-teal-600" },
    { name: "Group 6", members: ["Alex – PM", "Lily – Analyst", "Sam – Programmer", "Ivy – Documentarian"], status: "Adviser Not Assigned", color: "bg-amber-100 text-amber-600" },
    { name: "Group 7", members: ["Chris – PM", "Anna – Analyst", "Leo – Programmer", "Zoe – Documentarian"], status: "Adviser Assigned", color: "bg-teal-100 text-teal-600" },
    { name: "Group 8", members: ["Ben – PM", "Eva – Analyst", "Nick – Programmer", "Lana – Documentarian"], status: "Adviser Not Assigned", color: "bg-amber-100 text-amber-600" },
  ];

  const groupDocuments: Record<string, Document[]> = {
    "Group 1": [
      { name: "Concept Paper", submitted: "March 10, 2026", status: "Pending", type: "Proposal" },
      { name: "System Design", submitted: "March 12, 2026", status: "Approved", type: "Design" }
    ],
    "Group 2": [
      { name: "Concept Paper", submitted: "March 11, 2026", status: "Pending", type: "Proposal" },
      { name: "System Design", submitted: "March 15, 2026", status: "Pending", type: "Design" }
    ],
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'assigned' && group.status === 'Adviser Assigned') ||
      (statusFilter === 'not-assigned' && group.status === 'Adviser Not Assigned');
    return matchesSearch && matchesStatus;
  });

  const paginatedGroups = filteredGroups.slice(
    (currentPage - 1) * groupsPerPage,
    currentPage * groupsPerPage
  );

  const totalPages = Math.ceil(filteredGroups.length / groupsPerPage);

  const handleAddMember = () => {
    setMembers([...members, { fullName: '', program: 'BSIT', set: '', year: '', role: 'Project Manager' }]);
    setCurrentMemberPage(members.length);
  };

  const updateMember = (field: keyof Member, value: string) => {
    const updatedMembers = [...members];
    updatedMembers[currentMemberPage] = { ...updatedMembers[currentMemberPage], [field]: value };
    setMembers(updatedMembers);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName || members.length === 0) {
      alert("Please fill in group name and add at least one member.");
      return;
    }
    console.log("Group Created:", { name: newGroupName, members });
    alert(`Group "${newGroupName}" created with ${members.length} member(s).`);
    setNewGroupName('');
    setMembers([{ fullName: '', program: 'BSIT', set: '', year: '', role: 'Project Manager' }]);
    setCurrentMemberPage(0);
    setIsCreateModalOpen(false);
  };

  const handleScheduleDefense = () => {
    const { group, date, room, time } = defenseForm;
    if (!group || !date || !room || !time) {
      alert("Please complete all fields.");
      return;
    }

    const conflict = schedules.find(s =>
      s.date === date && s.room === room && s.time === time
    );

    if (conflict) {
      alert("Schedule conflict! Room and time already booked.");
      return;
    }

    setSchedules([...schedules, { group, date, room, time }]);
    setDefenseForm({ group: '', date: '', room: '', time: '' });
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar onModalOpen={setIsSignoutModalOpen} />

      <main className="flex-1 ml-0 md:ml-64">
        {/* Top Bar */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`bg-white/80 backdrop-blur-lg border-b border-slate-200 px-4 md:px-8 py-5 md:py-6 sticky top-0 z-40 shadow-sm ${isSignoutModalOpen ? 'blur-sm' : ''}`}
        >
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent pl-12 md:pl-0">
                Dashboard
              </h2>
              <p className="text-sm text-slate-500 mt-1">Instructor Dashboard</p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              {/* Program Switch */}
              <div>
                <label className="text-xs text-slate-500 block mb-1 font-medium">Program</label>
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all w-full sm:w-auto"
                >
                  <option value="bsit">BS Information Technology (BSIT)</option>
                  <option value="bsis">BS Information Systems (BSIS)</option>
                </select>
              </div>

              {/* Phase Switch */}
              <div>
                <label className="text-xs text-slate-500 block mb-1 font-medium">Phase</label>
                <select
                  value={selectedPhase}
                  onChange={(e) => setSelectedPhase(e.target.value)}
                  className="border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all w-full sm:w-auto"
                >
                  <option value="concept">Concept</option>
                  <option value="outline">Outline</option>
                  <option value="predeployment">Pre-Deployment</option>
                  <option value="deployment">Deployment</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <div className="p-4 md:p-8 space-y-8">
          {/* Statistics Cards */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6"
          >
            {stats.map((s, idx) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * idx }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
              >
                <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{s.label}</div>
                <div className="mt-3 flex items-end justify-between">
                  <div className="text-3xl font-bold text-slate-900">{s.value}</div>
                  <div className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${s.style} opacity-90`} />
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Adviser Load Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, delay: 0 } }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-slate-800 text-lg">Prof. Cruz</h3>
              <p className="text-sm text-slate-500 mb-4">Adviser Load</p>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "60%" }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-gradient-to-r from-teal-400 to-teal-600 h-3 rounded-full"
                />
              </div>
              <p className="text-xs text-slate-600 mt-3 font-medium">3 / 5 groups</p>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, delay: 0.1 } }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-slate-800 text-lg">Prof. Reyes</h3>
              <p className="text-sm text-slate-500 mb-4">Adviser Load</p>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "80%" }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  className="bg-gradient-to-r from-amber-400 to-amber-600 h-3 rounded-full"
                />
              </div>
              <p className="text-xs text-slate-600 mt-3 font-medium">4 / 5 groups</p>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, delay: 0.2 } }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-slate-800 text-lg">Prof. Santos</h3>
              <p className="text-sm text-slate-500 mb-4">Adviser Load</p>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                  className="bg-gradient-to-r from-rose-400 to-rose-600 h-3 rounded-full"
                />
              </div>
              <p className="text-xs text-rose-600 mt-3 font-semibold">5 / 5 groups (Full)</p>
            </motion.div>
          </motion.div>

          {/* Charts + Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-1 xl:grid-cols-3 gap-6"
          >
            <div className="xl:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">Approval Rate</h3>
                    <p className="text-sm text-slate-500 mt-1">Dummy trend (weekly)</p>
                  </div>
                  <div className="text-sm font-semibold text-slate-700">{approvalTrend[approvalTrend.length - 1]}%</div>
                </div>

                <div className="mt-6 h-36 flex items-end gap-2">
                  {approvalTrend.map((v, i) => (
                    <div key={i} className="flex-1">
                      <div className="w-full h-28 rounded-xl bg-slate-100 overflow-hidden flex items-end">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${v}%` }}
                          transition={{ duration: 0.7, delay: 0.05 * i }}
                          className="bg-gradient-to-t from-teal-500 to-indigo-500"
                          style={{ height: `${v}%` }}
                        />
                      </div>
                      <div className="mt-2 text-[10px] text-slate-500 text-center">W{i + 1}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Defense Status</h3>
                  <p className="text-sm text-slate-500 mt-1">Distribution snapshot</p>
                </div>

                <div className="mt-6 space-y-4">
                  {defenseStatus.map((d) => {
                    const total = defenseStatus.reduce((a, b) => a + b.value, 0);
                    const pct = total === 0 ? 0 : Math.round((d.value / total) * 100);

                    return (
                      <div key={d.label}>
                        <div className="flex items-center justify-between text-sm">
                          <div className="font-semibold text-slate-700">{d.label}</div>
                          <div className="text-slate-500">{d.value} ({pct}%)</div>
                        </div>
                        <div className="mt-2 w-full h-3 rounded-full bg-slate-200 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8 }}
                            className={`h-3 rounded-full bg-gradient-to-r ${d.className}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Notifications</h3>
                  <p className="text-sm text-slate-500 mt-1">Latest events</p>
                </div>
                <button
                  onClick={() => alert('UI only: open notifications center')}
                  className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                >
                  View all
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {dashboardNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-2xl border ${toneStyles[n.tone]} bg-white`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold">{n.title}</div>
                      <div className="text-xs opacity-80">{n.date}</div>
                    </div>
                    <div className="mt-1 text-sm text-slate-600">{n.message}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Upcoming Defenses + Deadlines Preview */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="grid grid-cols-1 xl:grid-cols-3 gap-6"
          >
            <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Upcoming Defenses</h2>
                  <p className="text-sm text-slate-500 mt-1">Quick view of scheduled defenses</p>
                </div>
                <button
                  onClick={() => alert('UI only: open scheduling page')}
                  className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all font-medium"
                >
                  Go to Scheduling
                </button>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600">
                      <th className="text-left py-4 font-semibold">Group</th>
                      <th className="text-left py-4 font-semibold">Date</th>
                      <th className="text-left py-4 font-semibold">Time</th>
                      <th className="text-left py-4 font-semibold">Room</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {upcomingDefenses.map((d, i) => (
                      <tr key={`${d.group}-${i}`} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 font-medium text-slate-800">{d.group}</td>
                        <td className="py-4 text-slate-600">{d.date}</td>
                        <td className="py-4 text-slate-600">{d.time}</td>
                        <td className="py-4 text-slate-600">{d.room}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Upcoming Deadlines</h2>
                  <p className="text-sm text-slate-500 mt-1">At-a-glance tracking</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  { phase: 'Concept', date: '2026-03-25', tone: 'bg-amber-100 text-amber-700' },
                  { phase: 'Proposal', date: '2026-04-10', tone: 'bg-teal-100 text-teal-700' },
                  { phase: 'Final Manuscript', date: '2026-04-15', tone: 'bg-teal-100 text-teal-700' },
                ].map((x) => (
                  <div key={x.phase} className="p-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-800">{x.phase}</div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${x.tone}`}>{x.date}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => alert('UI only: open deadline management')}
                className="mt-6 w-full bg-white border border-slate-300 text-slate-800 px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-all font-medium"
              >
                Manage Deadlines
              </button>
            </div>
          </motion.div>
        </div>

        {/* Create Group Modal */}
        <AnimatePresence>
          {isCreateModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setIsCreateModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-2xl rounded-2xl p-8 shadow-2xl max-h-[85vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">Create New Group</h2>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-2xl font-bold transition-colors"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleCreateGroup} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Group Name</label>
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Enter group name"
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="font-bold text-slate-800 mb-4 text-lg">
                      Member {currentMemberPage + 1} of {members.length}
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          value={members[currentMemberPage]?.fullName || ''}
                          onChange={(e) => updateMember('fullName', e.target.value)}
                          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Program</label>
                          <select
                            value={members[currentMemberPage]?.program || 'BSIT'}
                            onChange={(e) => updateMember('program', e.target.value)}
                            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="BSIT">BS Information Technology</option>
                            <option value="BSIS">BS Information Systems</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Set</label>
                          <input
                            type="text"
                            value={members[currentMemberPage]?.set || ''}
                            onChange={(e) => updateMember('set', e.target.value)}
                            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Year</label>
                          <input
                            type="text"
                            value={members[currentMemberPage]?.year || ''}
                            onChange={(e) => updateMember('year', e.target.value)}
                            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
                          <select
                            value={members[currentMemberPage]?.role || 'Project Manager'}
                            onChange={(e) => updateMember('role', e.target.value)}
                            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option>Project Manager</option>
                            <option>System Analyst</option>
                            <option>Programmer</option>
                            <option>Documentarian</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between mt-6">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setCurrentMemberPage(Math.max(0, currentMemberPage - 1))}
                        disabled={currentMemberPage === 0}
                        className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Prev
                      </motion.button>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setCurrentMemberPage(Math.min(members.length - 1, currentMemberPage + 1))}
                        disabled={currentMemberPage === members.length - 1}
                        className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Next
                      </motion.button>
                    </div>

                    <div className="flex justify-center mt-4">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAddMember}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium shadow-md transition-all"
                      >
                        + Add Member
                      </motion.button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-6 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium transition-all"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium shadow-md transition-all"
                    >
                      Create Group
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Group Details Modal */}
        <AnimatePresence>
          {isGroupModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setIsGroupModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-3xl rounded-2xl p-8 shadow-2xl max-h-[85vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">{selectedGroup} - Documents</h2>
                  <button
                    onClick={() => setIsGroupModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-2xl font-bold transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  {(groupDocuments[selectedGroup] || []).map((doc, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-6 border border-slate-200 rounded-xl bg-gradient-to-br from-slate-50 to-white"
                    >
                      <h3 className="font-bold text-slate-800 text-lg mb-2">{doc.name}</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 mb-4">
                        <p><span className="font-medium">Submitted:</span> {doc.submitted}</p>
                        <p><span className="font-medium">Type:</span> {doc.type}</p>
                        <p className="col-span-2">
                          <span className="font-medium">Status: </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${doc.status === 'Approved' ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                            {doc.status}
                          </span>
                        </p>
                      </div>
                      <textarea
                        placeholder="Add your comment..."
                        className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
                        rows={3}
                      />
                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-2 rounded-xl hover:shadow-md transition-all text-sm font-medium"
                        >
                          Approve
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-xl hover:shadow-md transition-all text-sm font-medium"
                        >
                          Route to Panel
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Dashboard;