import { motion } from 'framer-motion';
import Sidebar from '../../components/sidebar';

type Props = {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
};

const AdviserLayout = ({ title, subtitle, children }: Props) => {
    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <Sidebar />

            <main className="ml-0 flex-1 md:ml-64">
                <motion.div
                    initial={{ y: -16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 px-4 py-5 shadow-sm backdrop-blur-lg md:px-8 md:py-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="pl-12 text-xl font-bold text-slate-800 md:pl-0 md:text-2xl">{title}</h2>
                            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
                        </div>
                    </div>
                </motion.div>

                <div className="p-4 md:p-8">{children}</div>
            </main>
        </div>
    );
};

export default AdviserLayout;
