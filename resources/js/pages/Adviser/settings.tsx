import { useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { AlertTriangle, Lock, PenTool, Settings, Shield, User, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import AdviserLayout from './_layout';

type AdviserUser = {
    id?: number | string;
    name?: string;
    email?: string;
    role?: string;
    roles?: string[];
};

type AdviserPageProps = {
    auth?: {
        user?: AdviserUser;
    };
};

const formatRole = (role: string): string => {
    return role
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const AdviserSettings = () => {
    const { auth } = usePage<AdviserPageProps>().props;
    const user = auth?.user;
    const assignedRoles = user?.roles?.length ? user.roles : user?.role ? [user.role] : ['adviser'];

    const [name, setName] = useState(user?.name ?? 'Adviser');
    const [email, setEmail] = useState(user?.email ?? 'adviser@example.com');
    const [showPasswordConfirmationModal, setShowPasswordConfirmationModal] = useState(false);
    const [passwordSuccessMessage, setPasswordSuccessMessage] = useState('');
    const [signature, setSignature] = useState('');
    const [registeredSignature, setRegisteredSignature] = useState('');

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const signatureStorageKey = useMemo(() => `adviser-esignature-${user?.id ?? 'guest'}`, [user?.id]);

    useEffect(() => {
        const savedSignature = localStorage.getItem(signatureStorageKey);
        if (savedSignature !== null) {
            setRegisteredSignature(savedSignature);
            setSignature(savedSignature);
        }
    }, [signatureStorageKey]);

    const handleRegisterSignature = (): void => {
        const normalizedSignature = signature.trim();
        if (normalizedSignature.length === 0) {
            return;
        }

        localStorage.setItem(signatureStorageKey, normalizedSignature);
        setRegisteredSignature(normalizedSignature);
    };

    useEffect(() => {
        if (!showPasswordConfirmationModal) {
            return;
        }

        const originalOverflow = document.body.style.overflow;
        const onKeyDown = (event: KeyboardEvent): void => {
            if (event.key === 'Escape' && !passwordForm.processing) {
                setShowPasswordConfirmationModal(false);
            }
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [passwordForm.processing, showPasswordConfirmationModal]);

    const submitPasswordUpdate = (): void => {
        passwordForm.put('/adviser/settings/password', {
            preserveScroll: true,
            onSuccess: () => {
                setPasswordSuccessMessage('Password updated successfully.');
                setShowPasswordConfirmationModal(false);
                passwordForm.reset();
            },
            onError: () => {
                setShowPasswordConfirmationModal(false);
            },
        });
    };

    return (
        <AdviserLayout title="Settings" subtitle="Profile details, assigned role, and e-signature setup">
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
                            <div className="text-sm text-slate-500">Profile details from your account and adviser role assignment.</div>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6">
                            <div className="flex items-center gap-2">
                                <User size={18} className="text-slate-700" />
                                <div className="text-sm font-semibold text-slate-900">Profile</div>
                            </div>

                            <label className="mt-4 block text-sm font-semibold text-slate-700">Name</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            />

                            <label className="mt-4 block text-sm font-semibold text-slate-700">Email</label>
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            />

                            <button
                                type="button"
                                onClick={() => alert('UI only: save profile')}
                                className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                            >
                                Save profile
                            </button>

                            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center gap-2">
                                    <Shield size={16} className="text-slate-700" />
                                    <div className="text-sm font-semibold text-slate-900">Assigned Role</div>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {assignedRoles.map((role) => (
                                        <span
                                            key={role}
                                            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
                                        >
                                            {formatRole(role)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6">
                            <div className="flex items-center gap-2">
                                <Lock size={18} className="text-slate-700" />
                                <div className="text-sm font-semibold text-slate-900">Change Password</div>
                            </div>

                            {passwordSuccessMessage !== '' ? (
                                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                                    {passwordSuccessMessage}
                                </div>
                            ) : null}

                            <label className="mt-4 block text-sm font-semibold text-slate-700">Current Password</label>
                            <input
                                type="password"
                                value={passwordForm.data.current_password}
                                onChange={(e) => {
                                    setPasswordSuccessMessage('');
                                    passwordForm.setData('current_password', e.target.value);
                                }}
                                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            />
                            {passwordForm.errors.current_password ? (
                                <div className="mt-1 text-xs font-medium text-rose-600">{passwordForm.errors.current_password}</div>
                            ) : null}

                            <label className="mt-4 block text-sm font-semibold text-slate-700">New Password</label>
                            <input
                                type="password"
                                value={passwordForm.data.password}
                                onChange={(e) => {
                                    setPasswordSuccessMessage('');
                                    passwordForm.setData('password', e.target.value);
                                }}
                                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            />
                            {passwordForm.errors.password ? <div className="mt-1 text-xs font-medium text-rose-600">{passwordForm.errors.password}</div> : null}

                            <label className="mt-4 block text-sm font-semibold text-slate-700">Confirm New Password</label>
                            <input
                                type="password"
                                value={passwordForm.data.password_confirmation}
                                onChange={(e) => {
                                    setPasswordSuccessMessage('');
                                    passwordForm.setData('password_confirmation', e.target.value);
                                }}
                                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            />
                            {passwordForm.errors.password_confirmation ? (
                                <div className="mt-1 text-xs font-medium text-rose-600">{passwordForm.errors.password_confirmation}</div>
                            ) : null}

                            <button
                                type="button"
                                onClick={() => setShowPasswordConfirmationModal(true)}
                                disabled={passwordForm.processing}
                                className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                Update password
                            </button>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6">
                            <div className="flex items-center gap-2">
                                <PenTool size={18} className="text-slate-700" />
                                <div>
                                    <div className="text-sm font-semibold text-slate-900">E-Signature Registration</div>
                                    <div className="text-xs text-slate-500">Register your digital adviser signature.</div>
                                </div>
                            </div>

                            <label className="mt-4 block text-sm font-semibold text-slate-700">Digital Signature</label>
                            <input
                                value={signature}
                                onChange={(e) => setSignature(e.target.value)}
                                placeholder="Type your signature"
                                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm italic focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            />

                            <button
                                type="button"
                                onClick={handleRegisterSignature}
                                disabled={signature.trim().length === 0}
                                className="mt-4 w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
                            >
                                Register e-signature
                            </button>

                            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Registered Signature Preview</div>
                                <div className="mt-2 min-h-12 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-lg italic text-slate-700">
                                    {registeredSignature || 'No e-signature registered yet.'}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>
            </div>

            {showPasswordConfirmationModal && typeof document !== 'undefined'
                ? createPortal(
                      <div
                          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                          role="dialog"
                          aria-modal="true"
                          onMouseDown={(event) => {
                              if (event.target === event.currentTarget && !passwordForm.processing) {
                                  setShowPasswordConfirmationModal(false);
                              }
                          }}
                      >
                          <div
                              className="max-h-[90vh] w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl"
                              onMouseDown={(event) => event.stopPropagation()}
                          >
                              <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                                  <div className="flex items-center gap-2">
                                      <Lock className="h-5 w-5 text-gray-800" />
                                      <h2 className="text-lg font-bold text-gray-800">Update Password</h2>
                                  </div>
                                  <button
                                      type="button"
                                      onClick={() => setShowPasswordConfirmationModal(false)}
                                      className="rounded-lg p-1.5 text-gray-600 transition-all duration-200 hover:rotate-90 hover:bg-gray-200"
                                      disabled={passwordForm.processing}
                                  >
                                      <X className="h-5 w-5" />
                                  </button>
                              </div>

                              <div className="p-4">
                                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                      <div className="flex items-center gap-2">
                                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm">
                                              <AlertTriangle className="h-5 w-5" />
                                          </div>
                                          <div>
                                              <p className="text-sm font-bold text-amber-900">Confirm password update</p>
                                              <p className="text-xs text-amber-800">Your account password will be changed immediately after confirmation.</p>
                                          </div>
                                      </div>
                                  </div>
                              </div>

                              <div className="border-t border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                                  <div className="flex justify-end gap-2">
                                      <button
                                          type="button"
                                          onClick={() => setShowPasswordConfirmationModal(false)}
                                          disabled={passwordForm.processing}
                                          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                          Cancel
                                      </button>
                                      <button
                                          type="button"
                                          onClick={submitPasswordUpdate}
                                          disabled={passwordForm.processing}
                                          className="group relative z-10 flex transform items-center gap-2 overflow-hidden rounded-lg bg-amber-600 px-5 py-2 font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-amber-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                          <span className="pointer-events-none absolute inset-0 z-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]" />
                                          {passwordForm.processing ? (
                                              <>
                                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                  Updating...
                                              </>
                                          ) : (
                                              'Confirm Update'
                                          )}
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </div>,
                      document.body,
                  )
                : null}
        </AdviserLayout>
    );
};

export default AdviserSettings;
