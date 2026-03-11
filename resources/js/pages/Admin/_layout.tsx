import { usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Check, ChevronDown, GraduationCap } from 'lucide-react';
import React from 'react';
import Sidebar from '../../components/sidebar';

type Props = {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
};

type AcademicYearOption = {
    id: number;
    label: string;
    is_current: boolean;
};

type AdminLayoutPageProps = {
    academicYears?: AcademicYearOption[];
};

const AdminLayout = ({ title, subtitle, children }: Props) => {
    const { academicYears = [] } = usePage<AdminLayoutPageProps>().props;
    const [isAcademicYearOpen, setIsAcademicYearOpen] = React.useState(false);
    const [selectedAcademicYearId, setSelectedAcademicYearId] = React.useState<number | null>(null);
    const dropdownRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        if (selectedAcademicYearId !== null) {
            return;
        }

        const current = academicYears.find((year) => year.is_current) ?? academicYears[0];
        if (current) {
            setSelectedAcademicYearId(current.id);
        }
    }, [academicYears, selectedAcademicYearId]);

    const selectedAcademicYear =
        academicYears.find((year) => year.id === selectedAcademicYearId) ?? academicYears.find((year) => year.is_current) ?? academicYears[0] ?? null;

    React.useEffect(() => {
        if (!isAcademicYearOpen) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsAcademicYearOpen(false);
            }
        };

        const onPointerDown = (event: MouseEvent | TouchEvent) => {
            if (!dropdownRef.current) {
                return;
            }

            if (event.target instanceof Node && !dropdownRef.current.contains(event.target)) {
                setIsAcademicYearOpen(false);
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('touchstart', onPointerDown);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('touchstart', onPointerDown);
        };
    }, [isAcademicYearOpen]);

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

                        <div className="relative" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsAcademicYearOpen((open) => !open)}
                                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-900 shadow-sm transition hover:bg-emerald-100 focus:ring-2 focus:ring-emerald-300 focus:outline-none"
                                aria-haspopup="menu"
                                aria-expanded={isAcademicYearOpen}
                            >
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                                    <GraduationCap className="h-5 w-5" aria-hidden="true" />
                                </span>

                                <span className="hidden text-left leading-tight sm:block">
                                    <span className="block text-[10px] font-semibold tracking-wide text-emerald-700/80 uppercase">
                                        Current Year Level
                                    </span>
                                    <span className="block text-sm font-semibold">{selectedAcademicYear?.label ?? 'No Academic Year'}</span>
                                </span>

                                <span className="text-sm font-semibold sm:hidden">{selectedAcademicYear?.label ?? 'Academic Year'}</span>

                                <ChevronDown className={`h-4 w-4 transition ${isAcademicYearOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                            </button>

                            {isAcademicYearOpen ? (
                                <div
                                    role="menu"
                                    className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-lg ring-1 ring-emerald-100"
                                >
                                    <div className="border-b border-emerald-100 bg-emerald-50/60 px-4 py-3">
                                        <p className="text-xs font-semibold text-emerald-900">Select Academic Year</p>
                                        <p className="text-[11px] text-emerald-800/80">Showing the latest 2 academic years</p>
                                    </div>

                                    {academicYears.slice(0, 2).length ? (
                                        <div className="p-2">
                                            {academicYears.slice(0, 2).map((year) => {
                                                const isSelected = year.id === selectedAcademicYear?.id;

                                                return (
                                                    <button
                                                        key={year.id}
                                                        type="button"
                                                        role="menuitem"
                                                        onClick={() => {
                                                            setSelectedAcademicYearId(year.id);
                                                            setIsAcademicYearOpen(false);
                                                        }}
                                                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${
                                                            isSelected ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <span
                                                                className={`h-2 w-2 rounded-full ${
                                                                    year.is_current ? 'bg-emerald-500' : 'bg-slate-300'
                                                                }`}
                                                                aria-hidden="true"
                                                            />
                                                            <span className="text-sm font-medium">{year.label}</span>
                                                        </span>

                                                        {isSelected ? <Check className="h-4 w-4 text-emerald-600" /> : null}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="px-4 py-3 text-xs text-slate-500">No academic years found.</div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </motion.div>

                <div className="p-3 md:p-5">{children}</div>
            </main>
        </div>
    );
};

export default AdminLayout;
