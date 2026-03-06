import { useForm } from '@inertiajs/react';
import { Settings, UserCheck, X } from 'lucide-react';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

type UserRole = 'admin' | 'student' | 'adviser' | 'instructor' | 'panelist' | 'dean' | 'program_chairperson';
type FacultyRole = Exclude<UserRole, 'student'>;
type UserStatus = 'active' | 'inactive';
type StudentProgram = 'BSIT' | 'BSIS';
type ManageMode = 'user' | 'student' | 'faculty';

type ManagedUser = {
    id: number;
    fullName: string;
    firstName: string;
    lastName: string;
    email?: string;
    role?: UserRole;
    roles?: UserRole[];
    status: UserStatus;
    createdAt: string;
    program?: StudentProgram;
};

type ManageUserActionModalProps = {
    open: boolean;
    user: ManagedUser | null;
    mode?: ManageMode;
    submitUrl: string;
    onClose: () => void;
    onSave: (updatedUser: ManagedUser) => void;
};

type ManageUserForm = {
    first_name: string;
    last_name: string;
    email: string;
    roles: UserRole[];
    status: UserStatus;
    program: StudentProgram;
};

const userRoleOptions: UserRole[] = ['admin', 'student', 'adviser', 'instructor', 'panelist', 'dean', 'program_chairperson'];
const facultyRoleOptions: FacultyRole[] = ['admin', 'adviser', 'instructor', 'panelist', 'dean', 'program_chairperson'];

const ManageUserActionModal = ({ open, user, mode = 'user', submitUrl, onClose, onSave }: ManageUserActionModalProps) => {
    const [isAppearing, setIsAppearing] = React.useState(false);
    const { data, setData, errors, processing, clearErrors, put } = useForm<ManageUserForm>({
        first_name: '',
        last_name: '',
        email: '',
        roles: [userRoleOptions[0] ?? 'student'],
        status: 'active',
        program: 'BSIT',
    });
    const initializedUserIdRef = React.useRef<number | null>(null);
    const roleDropdownRef = React.useRef<HTMLDivElement | null>(null);
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = React.useState(false);

    useEffect(() => {
        if (user === null) {
            initializedUserIdRef.current = null;
            return;
        }

        if (initializedUserIdRef.current === user.id) {
            return;
        }

        initializedUserIdRef.current = user.id;
        clearErrors();
        setData({
            first_name: user.firstName,
            last_name: user.lastName,
            email: user.email ?? '',
            roles: user.roles && user.roles.length > 0 ? user.roles : [user.role ?? 'student'],
            status: user.status,
            program: user.program ?? 'BSIT',
        });
        setIsRoleDropdownOpen(false);
    }, [user, clearErrors, setData]);

    const toggleRole = (role: UserRole) => {
        setData(
            'roles',
            data.roles.includes(role) ? data.roles.filter((assignedRole) => assignedRole !== role) : [...data.roles, role],
        );
    };

    const formErrors = errors as Record<string, string | undefined>;
    const roleError = errors.roles ?? formErrors['roles.0'] ?? formErrors['roles.1'] ?? formErrors['roles.2'];
    const selectedRoleLabel = data.roles.length > 0 ? data.roles.map((role) => role.replaceAll('_', ' ')).join(', ') : 'Select roles';

    useEffect(() => {
        if (!isRoleDropdownOpen) {
            return;
        }

        const onMouseDown = (event: MouseEvent) => {
            if (roleDropdownRef.current !== null && !roleDropdownRef.current.contains(event.target as Node)) {
                setIsRoleDropdownOpen(false);
            }
        };

        window.addEventListener('mousedown', onMouseDown);

        return () => {
            window.removeEventListener('mousedown', onMouseDown);
        };
    }, [isRoleDropdownOpen]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !processing) {
                onClose();
            }
        };

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [open, onClose, processing]);

    useEffect(() => {
        if (!open) {
            setIsAppearing(false);
            return;
        }

        setIsAppearing(false);
        const animationFrame = window.requestAnimationFrame(() => {
            setIsAppearing(true);
        });

        return () => {
            window.cancelAnimationFrame(animationFrame);
        };
    }, [open]);

    if (!open || user === null || typeof document === 'undefined') {
        return null;
    }

    const modalTitle = mode === 'student' ? 'Manage Student' : mode === 'faculty' ? 'Manage Faculty' : 'Manage User';

    return createPortal(
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity duration-200 ${
                isAppearing ? 'opacity-100' : 'opacity-0'
            }`}
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !processing) {
                    onClose();
                }
            }}
        >
            <div
                className={`max-h-[90vh] w-full max-w-xl overflow-visible rounded-xl bg-white shadow-2xl transition-all duration-200 ${
                    isAppearing ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
                }`}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-emerald-800" />
                        <h2 className="text-lg font-bold text-emerald-900">{modalTitle}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-emerald-700 transition-all duration-200 hover:rotate-90 hover:bg-emerald-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4 p-4">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                        <p className="text-sm font-semibold text-emerald-900">Managing account</p>
                        <p className="text-xs text-emerald-800">
                            {user.fullName}
                            {data.email !== '' ? ` (${data.email})` : ''}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="text-sm font-semibold text-slate-700">First Name</label>
                            <input
                                value={data.first_name}
                                onChange={(event) => setData('first_name', event.target.value)}
                                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                            />
                            {errors.first_name ? <p className="mt-1 text-xs text-rose-600">{errors.first_name}</p> : null}
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-slate-700">Last Name</label>
                            <input
                                value={data.last_name}
                                onChange={(event) => setData('last_name', event.target.value)}
                                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                            />
                            {errors.last_name ? <p className="mt-1 text-xs text-rose-600">{errors.last_name}</p> : null}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700">Email</label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(event) => setData('email', event.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                        />
                        {errors.email ? <p className="mt-1 text-xs text-rose-600">{errors.email}</p> : null}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {mode === 'student' ? (
                            <div>
                                <label className="text-sm font-semibold text-slate-700">Program</label>
                                <select
                                    value={data.program}
                                    onChange={(event) => setData('program', event.target.value as StudentProgram)}
                                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="BSIT">BSIT</option>
                                    <option value="BSIS">BSIS</option>
                                </select>
                                {errors.program ? <p className="mt-1 text-xs text-rose-600">{errors.program}</p> : null}
                            </div>
                        ) : null}

                        {mode === 'faculty' ? (
                            <div>
                                <label className="text-sm font-semibold text-slate-700">Role</label>
                                <select
                                    value={(data.roles[0] as FacultyRole | undefined) ?? 'adviser'}
                                    onChange={(event) => setData('roles', [event.target.value as FacultyRole])}
                                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm capitalize focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                                >
                                    {facultyRoleOptions.map((roleOption) => (
                                        <option key={roleOption} value={roleOption}>
                                            {roleOption.replaceAll('_', ' ')}
                                        </option>
                                    ))}
                                </select>
                                {roleError ? <p className="mt-1 text-xs text-rose-600">{roleError}</p> : null}
                            </div>
                        ) : null}

                        {mode === 'user' ? (
                            <div>
                                <label className="text-sm font-semibold text-slate-700">Roles</label>
                                <div ref={roleDropdownRef} className="relative mt-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setIsRoleDropdownOpen((previousOpenState) => !previousOpenState)}
                                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-left text-sm capitalize focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                                    >
                                        {selectedRoleLabel}
                                    </button>

                                    {isRoleDropdownOpen ? (
                                        <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                                            <div className="grid grid-cols-1 gap-2">
                                                {userRoleOptions.map((roleOption) => (
                                                    <label key={roleOption} className="flex items-center gap-2 text-sm text-slate-700">
                                                        <input
                                                            type="checkbox"
                                                            checked={data.roles.includes(roleOption)}
                                                            onChange={() => toggleRole(roleOption)}
                                                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                        />
                                                        <span className="capitalize">{roleOption.replaceAll('_', ' ')}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                                {roleError ? <p className="mt-1 text-xs text-rose-600">{roleError}</p> : null}
                            </div>
                        ) : null}

                        <div>
                            <label className="text-sm font-semibold text-slate-700">Status</label>
                            <select
                                value={data.status}
                                onChange={(event) => setData('status', event.target.value as UserStatus)}
                                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm capitalize focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="active">active</option>
                                <option value="inactive">inactive</option>
                            </select>
                            {errors.status ? <p className="mt-1 text-xs text-rose-600">{errors.status}</p> : null}
                        </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">Created at: {user.createdAt}</div>
                </div>

                <div className="border-t border-slate-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-3">
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="rounded-lg border-2 border-slate-300 px-5 py-2 font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:shadow-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={processing}
                            onClick={() => {
                                put(submitUrl, {
                                    preserveScroll: true,
                                    preserveState: false,
                                    onSuccess: () => {
                                        const fullName = [data.last_name, data.first_name].filter((part) => part.trim() !== '').join(', ');
                                        const assignedRoles = data.roles.length > 0 ? data.roles : [user.role ?? 'student'];

                                        onSave({
                                            ...user,
                                            firstName: data.first_name,
                                            lastName: data.last_name,
                                            fullName,
                                            email: data.email,
                                            role: assignedRoles[0] ?? 'student',
                                            roles: assignedRoles,
                                            status: data.status,
                                            program: data.program,
                                        });
                                        clearErrors();
                                    },
                                });
                            }}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow-md"
                        >
                            {processing ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <UserCheck className="h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default ManageUserActionModal;
