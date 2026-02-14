import React from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../../components/sidebar';

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

const InstructorLayout = ({ title, subtitle, children }: Props) => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar />

      <main className="flex-1 ml-64">
        <motion.div
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/80 backdrop-blur-lg border-b border-slate-200 px-8 py-6 sticky top-0 z-40 shadow-sm"
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
              {subtitle ? <p className="text-sm text-slate-500 mt-1">{subtitle}</p> : null}
            </div>
          </div>
        </motion.div>

        <div className="p-8">{children}</div>
      </main>
    </div>
  );
};

export default InstructorLayout;
