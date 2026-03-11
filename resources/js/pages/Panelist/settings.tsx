import { usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Settings, Shield, User } from 'lucide-react';
import { useState } from 'react';
import ESignature from '@/components/Settings/ESignature';
import PasswordManager from '@/components/Settings/PasswordManager';
import ProfileCard from '@/components/Settings/ProfileCard';
import PanelLayout from './_layout';

type PanelistUser = {
    id?: number | string;
    name?: string;
    email?: string;
    role?: string;
    roles?: string[];
};

type PanelistPageProps = {
    auth?: {
        user?: PanelistUser;
    };
    eSignature?: {
        signatureData: string;
        mimeType: string;
    } | null;
};

const formatRole = (role: string): string => {
    return role
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const PanelSettings = () => {
    const { auth, eSignature } = usePage<PanelistPageProps>().props;
    const user = auth?.user;
    const assignedRoles = user?.roles?.length ? user.roles : user?.role ? [user.role] : ['panelist'];

    const [name, setName] = useState(user?.name ?? 'Panelist');
    const [email, setEmail] = useState(user?.email ?? 'panelist@example.com');

    return (
        <PanelLayout title="Settings" subtitle="Profile details, assigned role, and e-signature setup">
            <div className="space-y-6">
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    <div className="flex items-center gap-2">
                        <Settings size={18} className="text-slate-700" />
                        <div>
                            <div className="text-lg font-semibold text-slate-900">Account Settings</div>
                            <div className="text-sm text-slate-500">Profile details from your account and role assignment.</div>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
                        <ProfileCard name={name} email={email} assignedRoles={assignedRoles} />
                        <PasswordManager />
                        <ESignature
                            initialSignature={eSignature?.signatureData ?? ''}
                            upsertUrl="/panelist/settings/e-signature"
                            deleteUrl="/panelist/settings/e-signature"
                        />
                    </div>
                </motion.section>
            </div>
        </PanelLayout>
    );
};

export default PanelSettings;
