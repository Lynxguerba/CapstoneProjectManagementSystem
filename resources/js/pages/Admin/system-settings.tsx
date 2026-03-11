import { useForm } from '@inertiajs/react';
import type { Variants } from 'framer-motion';
import { motion } from 'framer-motion';
import { Bell, GraduationCap, ShieldCheck, Users } from 'lucide-react';
import React from 'react';
import ProfileCard from '@/components/Settings/ProfileCard';
import AdminLayout from './_layout';

type SystemSettingsData = {
    academicYear: string;
    semester: '1st' | '2nd' | 'summer';
    titleProposalDeadline: string;
    finalDefenseDeadline: string;
    siteWideNotification: string;
};

type UserRole = 'admin' | 'student' | 'adviser' | 'instructor' | 'panelist' | 'dean' | 'program_chairperson';
type UserStatus = 'active' | 'inactive';

type AdminUserRow = {
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    role: UserRole;
    roles: UserRole[];
    status: UserStatus;
    createdAt: string;
};

type AdminSystemSettingsProps = {
    settings?: Partial<SystemSettingsData>;
    adminUsers?: AdminUserRow[];
};

const SectionHeader = ({
    icon: Icon,
    title,
    description,
    withDivider = true,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    withDivider?: boolean;
}) => (
    <div className={`mb-5 flex items-center gap-3 ${withDivider ? 'border-b border-slate-100 pb-4' : ''}`}>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <Icon className="h-[18px] w-[18px]" />
        </div>
        <div>
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500">{description}</p>
        </div>
    </div>
);

const FormField = ({
    label,
    hint,
    error,
    children,
    span2 = false,
}: {
    label: string;
    hint?: string;
    error?: string;
    children: React.ReactNode;
    span2?: boolean;
}) => (
    <div className={span2 ? 'lg:col-span-2' : ''}>
        <label className="text-sm font-semibold text-slate-700">{label}</label>
        {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
        <div className="mt-1.5">{children}</div>
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
);

const inputClass =
    'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all';

// Typed cubic-bezier equivalent of 'easeOut' — avoids the Framer Motion string literal error.
const easeOut: [number, number, number, number] = [0.0, 0.0, 0.2, 1];

const containerVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
};

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: easeOut } },
};

const AdminSystemSettings = ({ settings, adminUsers }: AdminSystemSettingsProps) => {
    const academicYearForm = useForm<Pick<SystemSettingsData, 'academicYear'>>({
        academicYear: settings?.academicYear ?? '',
    });
    const notificationForm = useForm<Pick<SystemSettingsData, 'siteWideNotification'>>({
        siteWideNotification: settings?.siteWideNotification ?? '',
    });

    const admins = React.useMemo(() => {
        return Array.isArray(adminUsers) ? adminUsers : [];
    }, [adminUsers]);

    const [selectedAdminId, setSelectedAdminId] = React.useState<number | null>(() => {
        return admins[0]?.id ?? null;
    });

    React.useEffect(() => {
        if (admins.length === 0) {
            setSelectedAdminId(null);
            return;
        }

        if (selectedAdminId === null || !admins.some((admin) => admin.id === selectedAdminId)) {
            setSelectedAdminId(admins[0].id);
        }
    }, [admins, selectedAdminId]);

    const selectedAdmin = React.useMemo(() => {
        if (admins.length === 0) {
            return null;
        }

        return admins.find((admin) => admin.id === selectedAdminId) ?? admins[0];
    }, [admins, selectedAdminId]);

    const submitAcademicYear = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        academicYearForm.put('/admin/system-settings', { preserveScroll: true });
    };

    const submitSiteWideNotification = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        notificationForm.put('/admin/system-settings', { preserveScroll: true });
    };

    return (
        <AdminLayout title="System Settings" subtitle="Configure global capstone lifecycle settings">
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
                <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2">
                    {/* ── Academic Cycle & Site-wide Notification ── */}
                    <motion.section
                        variants={cardVariants}
                       className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1"
                    >
                        <form onSubmit={submitAcademicYear}>
                            <SectionHeader
                                icon={GraduationCap}
                                title="Academic Cycle"
                                description="Set the current academic year and active capstone phase."
                            />
                            <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
                                <FormField label="Academic year" hint="Format: YYYY–YYYY" error={academicYearForm.errors.academicYear} span2>
                                    <input
                                        value={academicYearForm.data.academicYear}
                                        onChange={(e) => academicYearForm.setData('academicYear', e.target.value)}
                                        placeholder="2025–2026"
                                        className={inputClass}
                                    />
                                </FormField>
                            </div>
                            <button
                                type="submit"
                                disabled={academicYearForm.processing}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-green-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-green-700 hover:to-green-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <ShieldCheck className="h-4 w-4" />
                                {academicYearForm.processing ? 'Saving...' : 'Save academic year'}
                            </button>
                        </form>

                        <div className="mt-6 border-t border-slate-100 pt-6">
                            <form onSubmit={submitSiteWideNotification}>
                                <SectionHeader
                                    icon={Bell}
                                    title="Site-wide Notification"
                                    description="This message will be displayed as a banner to all users across all roles."
                                    withDivider={false}
                                />
                                <FormField
                                    label="Notification message"
                                    hint="Leave blank to hide the notification banner."
                                    error={notificationForm.errors.siteWideNotification}
                                >
                                    <textarea
                                        value={notificationForm.data.siteWideNotification}
                                        onChange={(e) => notificationForm.setData('siteWideNotification', e.target.value)}
                                        rows={3}
                                        placeholder="e.g. Final defense schedules are now posted. Check your assigned panel."
                                        className={inputClass}
                                    />
                                </FormField>
                                <button
                                    type="submit"
                                    disabled={notificationForm.processing}
                                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-green-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-green-700 hover:to-green-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Bell className="h-4 w-4" />
                                    {notificationForm.processing ? 'Saving...' : 'Save notification'}
                                </button>
                            </form>
                        </div>
                    </motion.section>

                    {/* ── Account Profiles ── */}
                    <motion.section
                        variants={cardVariants}
                        className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1"
                    >
                        <SectionHeader
                            icon={Users}
                            title="Account Profiles"
                            description="Select an admin account to view profile details and assigned roles."
                        />

                        {admins.length === 0 ? (
                            <div className="flex-1 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                                No admin accounts found.
                            </div>
                        ) : (
                            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
                                <div className="space-y-6">
                                    {selectedAdmin !== null && (
                                        <>
                                            <ProfileCard
                                                name={selectedAdmin.fullName}
                                                email={selectedAdmin.email}
                                                assignedRoles={selectedAdmin.roles.length ? selectedAdmin.roles : [selectedAdmin.role]}
                                            />
                                        </>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <div className="text-sm font-semibold text-slate-700">Admin List</div>
                                    <div className="max-h-[360px] space-y-3 overflow-auto pr-1">
                                        {admins.map((admin) => {
                                            const isSelected = admin.id === selectedAdmin?.id;

                                            return (
                                                <button
                                                    key={admin.id}
                                                    type="button"
                                                    onClick={() => setSelectedAdminId(admin.id)}
                                                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                                                        isSelected
                                                            ? 'border-green-300 bg-green-50'
                                                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div>
                                                        <div className="text-sm font-medium text-slate-900">{admin.fullName}</div>
                                                        <div className="text-xs text-slate-500">{admin.email}</div>
                                                    </div>
                                                    <span
                                                        className={`rounded-full px-2 py-1 text-xs capitalize ${
                                                            admin.status === 'active'
                                                                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                                                : 'border border-slate-300 bg-slate-100 text-slate-700'
                                                        }`}
                                                    >
                                                        {admin.status}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.section>
                </div>
            </motion.div>
        </AdminLayout>
    );
};

export default AdminSystemSettings;
