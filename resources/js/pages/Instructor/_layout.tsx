import { motion } from 'framer-motion';
import React from 'react';
import Sidebar from '../../components/sidebar';

type Props = {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
};

const InstructorLayout = ({ title, subtitle, children }: Props) => {
    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-sm">
            <Sidebar />

            <main className="ml-0 flex-1 md:ml-56">
                <motion.div
                    initial={{ y: -12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-md md:px-6 md:py-3"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="pl-10 text-lg font-semibold text-slate-800 md:pl-0 md:text-xl">{title}</h2>
                            {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
                        </div>
                    </div>
                </motion.div>

                <div className="p-3 md:p-5">{children}</div>
            </main>
        </div>
    );
};

export default InstructorLayout;
