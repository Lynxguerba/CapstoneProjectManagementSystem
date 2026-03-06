import { useForm } from '@inertiajs/react';
import { UserPlus, X } from 'lucide-react';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { store } from '../../routes/admin/users';

type UserRole = 'admin' | 'student' | 'adviser' | 'instructor' | 'panelist' | 'dean' | 'program_chairperson';
type FacultyRole = 'admin' | 'faculty';
type UserStatus = 'active' | 'inactive';
type StudentProgram = 'BSIT' | 'BSIS';
type EntityType = 'user' | 'faculty' | 'student';

type AddUserModalProps = {
    open: boolean;
    onClose: () => void;
    availableRoles?: UserRole[];
    userType?: EntityType;
};

type AddUserForm = {
    first_name: string;
    last_name: string;
    email: string;
    roles: string[];
    status: UserStatus;
    password: string;
    program: StudentProgram;
};

const defaultRoles: UserRole[] = ['admin', 'student', 'adviser', 'instructor', 'panelist', 'dean', 'program_chairperson'];
const facultyRoles: FacultyRole[] = ['admin', 'faculty'];

const AddUserModal = ({ open, onClose, availableRoles = defaultRoles, userType = 'user' }: AddUserModalProps) => {
    const [isAppearing, setIsAppearing] = React.useState(false);
    const roleOptions = userType === 'faculty' ? facultyRoles : availableRoles;
    const initialRole = roleOptions[0] ?? 'student';

    const addUserForm = useForm<AddUserForm>({
        first_name: '',
        last_name: '',
        email: '',
        roles: [initialRole],
        status: 'active',
        password: '',
        program: 'BSIT',
    });

    useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !addUserForm.processing) {
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
    }, [open, onClose, addUserForm.processing]);

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

    useEffect(() => {
        addUserForm.setData('roles', [initialRole]);
    }, [addUserForm, initialRole]);

    const submitForm = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        addUserForm.post(
            store.url({
                query: {
                    type: userType,
                },
            }),
            {
                preserveScroll: true,
                preserveState: false,
                onSuccess: () => {
                    addUserForm.reset();
                    addUserForm.setData('program', 'BSIT');
                    addUserForm.setData('roles', [initialRole]);
                    onClose();
                },
            },
        );
    };

    const toggleRole = (role: string) => {
        addUserForm.setData('roles',
            addUserForm.data.roles.includes(role)
                ? addUserForm.data.roles.filter((assignedRole) => assignedRole !== role)
                : [...addUserForm.data.roles, role],
        );
    };

    const formErrors = addUserForm.errors as Record<string, string | undefined>;
    const roleError =
        addUserForm.errors.roles ??
        formErrors['roles.0'] ??
        formErrors['roles.1'] ??
        formErrors['roles.2'];

    if (!open || typeof document === 'undefined') {
        return null;
    }

    const modalTitle = userType === 'student' ? 'Add Student' : userType === 'faculty' ? 'Add Faculty' : 'Add User';
    const submitLabel = userType === 'student' ? 'Create Student' : userType === 'faculty' ? 'Create Faculty' : 'Create User';

    return createPortal(
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity duration-200 ${
                isAppearing ? 'opacity-100' : 'opacity-0'
            }`}
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !addUserForm.processing) {
                    onClose();
                }
            }}
        >
            <div
                className={`max-h-[90vh] w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-200 ${
                    isAppearing ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
                }`}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-emerald-800" />
                        <h2 className="text-lg font-bold text-emerald-900">{modalTitle}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={addUserForm.processing}
                        className="rounded-lg p-1.5 text-emerald-700 transition-all duration-200 hover:rotate-90 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={submitForm} className="space-y-4 p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Last Name</label>
                            <input
                                value={addUserForm.data.last_name}
                                onChange={(event) => addUserForm.setData('last_name', event.target.value)}
                                placeholder="Dela Cruz"
                                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                            />
                            {addUserForm.errors.last_name ? <p className="mt-1 text-xs text-rose-600">{addUserForm.errors.last_name}</p> : null}
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-700">First Name</label>
                            <input
                                value={addUserForm.data.first_name}
                                onChange={(event) => addUserForm.setData('first_name', event.target.value)}
                                placeholder="Juan"
                                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                            />
                            {addUserForm.errors.first_name ? <p className="mt-1 text-xs text-rose-600">{addUserForm.errors.first_name}</p> : null}
                        </div>
                    </div>

                    {userType === 'student' ? (
                        <>
                            <div>
                                <label className="text-sm font-semibold text-slate-700">Program</label>
                                <select
                                    value={addUserForm.data.program}
                                    onChange={(event) => addUserForm.setData('program', event.target.value as StudentProgram)}
                                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="BSIT">BSIT</option>
                                    <option value="BSIS">BSIS</option>
                                </select>
                                {addUserForm.errors.program ? <p className="mt-1 text-xs text-rose-600">{addUserForm.errors.program}</p> : null}
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700">Password</label>
                                <input
                                    type="password"
                                    value={addUserForm.data.password}
                                    onChange={(event) => addUserForm.setData('password', event.target.value)}
                                    placeholder="At least 8 characters"
                                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                                />
                                {addUserForm.errors.password ? <p className="mt-1 text-xs text-rose-600">{addUserForm.errors.password}</p> : null}
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="text-sm font-semibold text-slate-700">Email</label>
                                <input
                                    type="email"
                                    value={addUserForm.data.email}
                                    onChange={(event) => addUserForm.setData('email', event.target.value)}
                                    placeholder="user@campus.edu"
                                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                                />
                                {addUserForm.errors.email ? <p className="mt-1 text-xs text-rose-600">{addUserForm.errors.email}</p> : null}
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700">Roles</label>
                                <div className="mt-1.5 grid grid-cols-1 gap-2 rounded-xl border border-slate-300 bg-slate-50 p-3 sm:grid-cols-2">
                                    {roleOptions.map((role) => (
                                        <label key={role} className="flex items-center gap-2 text-sm text-slate-700">
                                            <input
                                                type="checkbox"
                                                checked={addUserForm.data.roles.includes(role)}
                                                onChange={() => toggleRole(role)}
                                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span className="capitalize">{role.replaceAll('_', ' ')}</span>
                                        </label>
                                    ))}
                                </div>
                                {roleError ? <p className="mt-1 text-xs text-rose-600">{roleError}</p> : null}
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700">Status</label>
                                <select
                                    value={addUserForm.data.status}
                                    onChange={(event) => addUserForm.setData('status', event.target.value as UserStatus)}
                                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm capitalize focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="active">active</option>
                                    <option value="inactive">inactive</option>
                                </select>
                                {addUserForm.errors.status ? <p className="mt-1 text-xs text-rose-600">{addUserForm.errors.status}</p> : null}
                            </div>
                        </>
                    )}

                    {userType === 'user' ? (
                        <div>
                            <label className="text-sm font-semibold text-slate-700">Temporary password</label>
                            <input
                                type="password"
                                value={addUserForm.data.password}
                                onChange={(event) => addUserForm.setData('password', event.target.value)}
                                placeholder="At least 8 characters"
                                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                            />
                            {addUserForm.errors.password ? <p className="mt-1 text-xs text-rose-600">{addUserForm.errors.password}</p> : null}
                        </div>
                    ) : null}

                    <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={addUserForm.processing}
                            className="rounded-lg border-2 border-slate-300 px-5 py-2 font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={addUserForm.processing}
                            className="rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {addUserForm.processing ? 'Creating...' : submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
};

export default AddUserModal;
