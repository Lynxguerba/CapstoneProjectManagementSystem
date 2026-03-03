import { motion } from 'framer-motion';
import React from 'react';
import DeanLayout from './_layout';

const DeanDashboard = () => {
    return (
        <DeanLayout title="Dashboard" subtitle="Welcome back, Dean">
            <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
                <h3 className="text-lg font-semibold text-slate-900">Dean Overview</h3>
                <p className="mt-2 text-sm text-slate-600">
                    Use the sidebar to review projects, monitor students, and access reports.
                </p>
            </motion.section>
        </DeanLayout>
    );
};

export default DeanDashboard;
