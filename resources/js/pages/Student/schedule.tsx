import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Lock, MapPin, Timer } from 'lucide-react';
import StudentLayout from './_layout';

type DefenseType = 'Outline Defense' | 'Pre-Deployment Defense' | 'Final Defense';

type DefenseSchedule = {
  type: DefenseType;
  date: string;
  time: string;
  room: string;
  panel: string[];
  payment: 'Verified' | 'Not Verified';
};

const StudentSchedule = () => {
  const schedule: DefenseSchedule[] = [
    {
      type: 'Outline Defense',
      date: '2026-03-22',
      time: '9:00 AM - 10:00 AM',
      room: 'Room 101',
      panel: ['Prof. Aquino', 'Prof. Tan', 'Prof. Garcia'],
      payment: 'Verified',
    },
    {
      type: 'Pre-Deployment Defense',
      date: '2026-04-12',
      time: '1:00 PM - 2:00 PM',
      room: 'Room 102',
      panel: ['Prof. Cruz', 'Prof. Reyes', 'Prof. Santos'],
      payment: 'Verified',
    },
    {
      type: 'Final Defense',
      date: '2026-05-02',
      time: '10:00 AM - 11:00 AM',
      room: 'Room 101',
      panel: ['Prof. Aquino', 'Prof. Tan', 'Prof. Garcia'],
      payment: 'Not Verified',
    },
  ];

  const paymentLocked = schedule.some((s) => s.payment === 'Not Verified');

  return (
    <StudentLayout title="Defense Schedule" subtitle="View-only schedule with payment lock messaging">
      <div className="space-y-6">
        {paymentLocked ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-amber-200 bg-amber-50 p-5"
          >
            <div className="flex items-center gap-2 text-amber-900 font-semibold">
              <Lock size={16} />
              Defense scheduling locked until payment verification.
            </div>
            <div className="mt-1 text-sm text-amber-900/80">(UI only message, backend will enforce later.)</div>
          </motion.div>
        ) : null}

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-slate-700" />
            <h3 className="text-lg font-semibold text-slate-900">Defense Schedule</h3>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="text-left py-3 font-semibold">Defense Type</th>
                  <th className="text-left py-3 font-semibold">Date</th>
                  <th className="text-left py-3 font-semibold">Time</th>
                  <th className="text-left py-3 font-semibold">Room</th>
                  <th className="text-left py-3 font-semibold">Panel</th>
                  <th className="text-left py-3 font-semibold">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedule.map((s) => (
                  <tr key={s.type} className="hover:bg-slate-50">
                    <td className="py-3 font-medium text-slate-900 whitespace-nowrap">{s.type}</td>
                    <td className="py-3 text-slate-600 whitespace-nowrap">{s.date}</td>
                    <td className="py-3 text-slate-600 whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <Timer size={14} />
                        {s.time}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600 whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <MapPin size={14} />
                        {s.room}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600 min-w-[220px]">
                      {s.panel.join(', ')}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${s.payment === 'Verified'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                      >
                        {s.payment}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>
    </StudentLayout>
  );
};

export default StudentSchedule;
