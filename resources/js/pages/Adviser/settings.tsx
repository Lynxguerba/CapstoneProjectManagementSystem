import { router, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { AlertTriangle, Eraser, Eye, EyeOff, Lock, PenTool, Settings, Shield, Trash2, User, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import SignatureCanvas from 'react-signature-canvas';
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

const AdviserSettings = () => {
    const { auth, eSignature } = usePage<AdviserPageProps>().props;
    const user = auth?.user;
    const assignedRoles = user?.roles?.length ? user.roles : user?.role ? [user.role] : ['adviser'];

    const [name, setName] = useState(user?.name ?? 'Adviser');
    const [email, setEmail] = useState(user?.email ?? 'adviser@example.com');
    const [showPasswordConfirmationModal, setShowPasswordConfirmationModal] = useState(false);
    const [showESignatureModal, setShowESignatureModal] = useState(false);
    const [passwordSuccessMessage, setPasswordSuccessMessage] = useState('');
    const [registeredSignature, setRegisteredSignature] = useState(eSignature?.signatureData ?? '');
    const [isSignaturePadEmpty, setIsSignaturePadEmpty] = useState(true);
    const signaturePadRef = useRef<SignatureCanvas | null>(null);

    // FOR PASSWORD FIELDS
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        setRegisteredSignature(eSignature?.signatureData ?? '');
    }, [eSignature]);

    const signatureForm = useForm({
        signature_data: '',
        mime_type: 'image/png',
    });

    const registerOrUpdateSignature = (): void => {
        if (signaturePadRef.current === null || signaturePadRef.current.isEmpty()) {
            return;
        }

        const signatureDataUrl = signaturePadRef.current.toDataURL('image/png');
        signatureForm.transform(() => ({
            signature_data: signatureDataUrl,
            mime_type: 'image/png',
        }));

        signatureForm.put('/adviser/settings/e-signature', {
            preserveScroll: true,
            onSuccess: () => {
                setRegisteredSignature(signatureDataUrl);
                setIsSignaturePadEmpty(false);
                setShowESignatureModal(false);
            },
            onFinish: () => {
                signatureForm.transform((data) => data);
            },
        });
    };

    const removeSignature = (): void => {
        router.delete('/adviser/settings/e-signature', {
            preserveScroll: true,
            onSuccess: () => {
                signaturePadRef.current?.clear();
                setRegisteredSignature('');
                setIsSignaturePadEmpty(true);
                setShowESignatureModal(false);
            },
        });
    };

    const clearSignaturePad = (): void => {
        signaturePadRef.current?.clear();
        setIsSignaturePadEmpty(true);
    };

    const handleSignaturePadEnd = (): void => {
        if (signaturePadRef.current === null) {
            return;
        }

        setIsSignaturePadEmpty(signaturePadRef.current.isEmpty());
    };

    useEffect(() => {
        if (!showPasswordConfirmationModal && !showESignatureModal) {
            return;
        }

        const originalOverflow = document.body.style.overflow;
        const onKeyDown = (event: KeyboardEvent): void => {
            if (event.key !== 'Escape') {
                return;
            }

            if (showPasswordConfirmationModal && !passwordForm.processing) {
                setShowPasswordConfirmationModal(false);
            }

            if (showESignatureModal && !signatureForm.processing) {
                setShowESignatureModal(false);
            }
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [passwordForm.processing, showESignatureModal, showPasswordConfirmationModal, signatureForm.processing]);

    useEffect(() => {
        if (!showESignatureModal) {
            return;
        }

        const timer = window.setTimeout(() => {
            if (signaturePadRef.current === null) {
                return;
            }

            signaturePadRef.current.clear();

            if (registeredSignature !== '') {
                signaturePadRef.current.fromDataURL(registeredSignature);
                setIsSignaturePadEmpty(false);
                return;
            }

            setIsSignaturePadEmpty(true);
        }, 0);

        return () => {
            window.clearTimeout(timer);
        };
    }, [registeredSignature, showESignatureModal]);

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
                                <div className="text-sm font-semibold text-slate-900">Password Manager</div>
                            </div>

                            {passwordSuccessMessage !== '' && (
                                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                                    {passwordSuccessMessage}
                                </div>
                            )}

                            {/* Current Password */}
                            <div className="mt-4">
                                <label className="block text-sm font-semibold text-slate-700">Current Password</label>
                                <div className="relative mt-2">
                                    <input
                                        type={showCurrent ? 'text' : 'password'}
                                        value={passwordForm.data.current_password}
                                        onChange={(e) => {
                                            setPasswordSuccessMessage('');
                                            passwordForm.setData('current_password', e.target.value);
                                        }}
                                        className="w-full rounded-xl border border-slate-300 bg-white py-3 pr-11 pl-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrent(!showCurrent)}
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {passwordForm.errors.current_password && (
                                    <div className="mt-1 text-xs font-medium text-rose-600">{passwordForm.errors.current_password}</div>
                                )}
                            </div>

                            {/* New Password */}
                            <div className="mt-4">
                                <label className="block text-sm font-semibold text-slate-700">New Password</label>
                                <div className="relative mt-2">
                                    <input
                                        type={showNew ? 'text' : 'password'}
                                        value={passwordForm.data.password}
                                        onChange={(e) => {
                                            setPasswordSuccessMessage('');
                                            passwordForm.setData('password', e.target.value);
                                        }}
                                        className="w-full rounded-xl border border-slate-300 bg-white py-3 pr-11 pl-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNew(!showNew)}
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {passwordForm.errors.password && (
                                    <div className="mt-1 text-xs font-medium text-rose-600">{passwordForm.errors.password}</div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="mt-4">
                                <label className="block text-sm font-semibold text-slate-700">Confirm New Password</label>
                                <div className="relative mt-2">
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        value={passwordForm.data.password_confirmation}
                                        onChange={(e) => {
                                            setPasswordSuccessMessage('');
                                            passwordForm.setData('password_confirmation', e.target.value);
                                        }}
                                        className="w-full rounded-xl border border-slate-300 bg-white py-3 pr-11 pl-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {passwordForm.errors.password_confirmation && (
                                    <div className="mt-1 text-xs font-medium text-rose-600">{passwordForm.errors.password_confirmation}</div>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowPasswordConfirmationModal(true)}
                                disabled={passwordForm.processing}
                                className="mt-6 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                Update password
                            </button>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6">
                            <div className="flex items-center gap-2">
                                <PenTool size={18} className="text-slate-700" />
                                <div>
                                    <div className="text-sm font-semibold text-slate-900">E-Signature</div>
                                    <div className="text-xs text-slate-500">Register or update your mouse-drawn digital signature.</div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowESignatureModal(true)}
                                className="mt-4 w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
                            >
                                E-Sign
                            </button>

                            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Registered Signature Preview</div>
                                <div className="mt-2 flex min-h-28 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2">
                                    {registeredSignature !== '' ? (
                                        <img src={registeredSignature} alt="Registered adviser e-signature" className="max-h-24 w-auto object-contain" />
                                    ) : (
                                        <span className="text-sm text-slate-500">No e-signature registered yet.</span>
                                    )}
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
                                              <p className="text-xs text-amber-800">
                                                  Your account password will be changed immediately after confirmation.
                                              </p>
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

            {showESignatureModal && typeof document !== 'undefined'
                ? createPortal(
                      <div
                          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                          role="dialog"
                          aria-modal="true"
                          onMouseDown={(event) => {
                              if (event.target === event.currentTarget && !signatureForm.processing) {
                                  setShowESignatureModal(false);
                              }
                          }}
                      >
                          <div
                              className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl"
                              onMouseDown={(event) => event.stopPropagation()}
                          >
                              <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                                  <div className="flex items-center gap-2">
                                      <PenTool className="h-5 w-5 text-gray-800" />
                                      <h2 className="text-lg font-bold text-gray-800">
                                          {registeredSignature !== '' ? 'Update E-Signature' : 'Register E-Signature'}
                                      </h2>
                                  </div>
                                  <button
                                      type="button"
                                      onClick={() => setShowESignatureModal(false)}
                                      disabled={signatureForm.processing}
                                      className="rounded-lg p-1.5 text-gray-600 transition-all duration-200 hover:rotate-90 hover:bg-gray-200"
                                  >
                                      <X className="h-5 w-5" />
                                  </button>
                              </div>

                              <div className="p-4">
                                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                      <p className="text-sm font-medium text-slate-700">Use your mouse cursor to draw your signature.</p>
                                  </div>

                                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-300 bg-white">
                                      <SignatureCanvas
                                          ref={signaturePadRef}
                                          penColor="#111827"
                                          onEnd={handleSignaturePadEnd}
                                          canvasProps={{
                                              className: 'h-64 w-full',
                                          }}
                                      />
                                  </div>
                              </div>

                              <div className="border-t border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                                  <div className="flex flex-wrap justify-end gap-2">
                                      <button
                                          type="button"
                                          onClick={clearSignaturePad}
                                          disabled={signatureForm.processing}
                                          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                      >
                                          <Eraser className="h-4 w-4" />
                                          Clear
                                      </button>

                                      {registeredSignature !== '' ? (
                                          <button
                                              type="button"
                                              onClick={removeSignature}
                                              disabled={signatureForm.processing}
                                              className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                                          >
                                              <Trash2 className="h-4 w-4" />
                                              Remove
                                          </button>
                                      ) : null}

                                      <button
                                          type="button"
                                          onClick={registerOrUpdateSignature}
                                          disabled={isSignaturePadEmpty || signatureForm.processing}
                                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-300"
                                      >
                                          {signatureForm.processing ? 'Saving...' : registeredSignature !== '' ? 'Update' : 'Register'}
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
