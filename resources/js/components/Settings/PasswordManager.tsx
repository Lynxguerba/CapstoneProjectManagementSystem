import { useForm } from '@inertiajs/react';
import { AlertTriangle, Eye, EyeOff, Lock, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const PasswordManager = () => {
    const [showPasswordConfirmationModal, setShowPasswordConfirmationModal] = useState(false);
    const [isPasswordModalAppearing, setIsPasswordModalAppearing] = useState(false);
    const [passwordSuccessMessage, setPasswordSuccessMessage] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        if (!showPasswordConfirmationModal) return;

        const originalOverflow = document.body.style.overflow;
        const onKeyDown = (event: KeyboardEvent): void => {
            if (event.key !== 'Escape' || passwordForm.processing) return;
            setShowPasswordConfirmationModal(false);
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [showPasswordConfirmationModal, passwordForm.processing]);

    useEffect(() => {
        if (!showPasswordConfirmationModal) {
            setIsPasswordModalAppearing(false);
            return;
        }

        setIsPasswordModalAppearing(false);
        const animationFrame = window.requestAnimationFrame(() => {
            setIsPasswordModalAppearing(true);
        });

        return () => {
            window.cancelAnimationFrame(animationFrame);
        };
    }, [showPasswordConfirmationModal]);

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
        <>
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

            {/* Confirmation Modal */}
            {showPasswordConfirmationModal && typeof document !== 'undefined'
                ? createPortal(
                      <div
                          className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity duration-200 ${
                              isPasswordModalAppearing ? 'opacity-100' : 'opacity-0'
                          }`}
                          role="dialog"
                          aria-modal="true"
                          onMouseDown={(event) => {
                              if (event.target === event.currentTarget && !passwordForm.processing) {
                                  setShowPasswordConfirmationModal(false);
                              }
                          }}
                      >
                          <div
                              className={`max-h-[90vh] w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-200 ${
                                  isPasswordModalAppearing ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
                              }`}
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
        </>
    );
};

export default PasswordManager;
