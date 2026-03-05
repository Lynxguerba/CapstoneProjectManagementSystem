import { usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Settings, Shield, User } from 'lucide-react';
import { useState } from 'react';
import ESignature from '@/components/Settings/ESignature';
import PasswordManager from '@/components/Settings/PasswordManager';

import ProgramChairpersonLayout from './_layout';
import ProfileCard from '@/components/Settings/ProfileCard';

type ProgramChairpersonUser = {
    id?: number | string;
    name?: string;
    email?: string;
    role?: string;
    roles?: string[];
};

type ProgramChairpersonPageProps = {
    auth?: {
        user?: ProgramChairpersonUser;
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

const ProgramChairpersonSettings = () => {
    const { auth, eSignature } = usePage<ProgramChairpersonPageProps>().props;
    const user = auth?.user;
    const assignedRoles = user?.roles?.length ? user.roles : user?.role ? [user.role] : ['program_chairperson'];

    const [name, setName] = useState(user?.name ?? 'Program Chairperson');
    const [email, setEmail] = useState(user?.email ?? 'programchairperson@example.com');

    return (
        <ProgramChairpersonLayout title="Settings" subtitle="Profile details, assigned role, and e-signature setup">
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
                            upsertUrl="/program_chairperson/settings/e-signature"
                            deleteUrl="/program_chairperson/settings/e-signature"
                        />
                    </div>
                </motion.section>
            </div>
        </ProgramChairpersonLayout>
    );
};

export default ProgramChairpersonSettings;
