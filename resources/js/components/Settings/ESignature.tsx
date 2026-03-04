import { router, useForm } from '@inertiajs/react';
import { Eraser, PenTool, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import SignatureCanvas from 'react-signature-canvas';

type ESignatureProps = {
    initialSignature?: string;
    upsertUrl?: string;
    deleteUrl?: string;
};

const ESignature = ({ initialSignature = '', upsertUrl = '/adviser/settings/e-signature', deleteUrl = '/adviser/settings/e-signature' }: ESignatureProps) => {
    const [showESignatureModal, setShowESignatureModal] = useState(false);
    const [registeredSignature, setRegisteredSignature] = useState(initialSignature);
    const [isSignaturePadEmpty, setIsSignaturePadEmpty] = useState(true);
    const signaturePadRef = useRef<SignatureCanvas | null>(null);

    const signatureForm = useForm({
        signature_data: '',
        mime_type: 'image/png',
    });

    useEffect(() => {
        setRegisteredSignature(initialSignature);
    }, [initialSignature]);

    const resolveRoleAwareEndpoint = (fallbackUrl: string): string => {
        if (typeof window === 'undefined') {
            return fallbackUrl;
        }

        const rolePrefix = window.location.pathname.split('/').filter(Boolean)[0] ?? '';
        const supportedRolePrefixes = ['adviser', 'dean', 'panelist', 'instructor'];

        if (supportedRolePrefixes.includes(rolePrefix)) {
            return `/${rolePrefix}/settings/e-signature`;
        }

        return fallbackUrl;
    };

    const effectiveUpsertUrl = resolveRoleAwareEndpoint(upsertUrl);
    const effectiveDeleteUrl = resolveRoleAwareEndpoint(deleteUrl);

    // Escape key + body scroll lock
    useEffect(() => {
        if (!showESignatureModal) return;

        const originalOverflow = document.body.style.overflow;
        const onKeyDown = (event: KeyboardEvent): void => {
            if (event.key !== 'Escape' || signatureForm.processing) return;
            setShowESignatureModal(false);
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [showESignatureModal, signatureForm.processing]);

    // Load existing signature into canvas when modal opens
    useEffect(() => {
        if (!showESignatureModal) return;

        const timer = window.setTimeout(() => {
            if (signaturePadRef.current === null) return;

            signaturePadRef.current.clear();

            if (registeredSignature !== '') {
                signaturePadRef.current.fromDataURL(registeredSignature);
                setIsSignaturePadEmpty(false);
                return;
            }

            setIsSignaturePadEmpty(true);
        }, 0);

        return () => window.clearTimeout(timer);
    }, [registeredSignature, showESignatureModal]);

    const handleSignaturePadEnd = (): void => {
        if (signaturePadRef.current === null) return;
        setIsSignaturePadEmpty(signaturePadRef.current.isEmpty());
    };

    const clearSignaturePad = (): void => {
        signaturePadRef.current?.clear();
        setIsSignaturePadEmpty(true);
    };

    const registerOrUpdateSignature = (): void => {
        if (signaturePadRef.current === null || signaturePadRef.current.isEmpty()) return;

        const signatureDataUrl = signaturePadRef.current.toDataURL('image/png');
        signatureForm.transform(() => ({
            signature_data: signatureDataUrl,
            mime_type: 'image/png',
        }));

        signatureForm.put(effectiveUpsertUrl, {
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
        router.delete(effectiveDeleteUrl, {
            preserveScroll: true,
            onSuccess: () => {
                signaturePadRef.current?.clear();
                setRegisteredSignature('');
                setIsSignaturePadEmpty(true);
                setShowESignatureModal(false);
            },
        });
    };

    return (
        <>
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
                {signatureForm.errors.signature_data && (
                    <div className="mt-2 text-xs font-medium text-rose-600">{signatureForm.errors.signature_data}</div>
                )}
                {signatureForm.errors.mime_type && <div className="mt-1 text-xs font-medium text-rose-600">{signatureForm.errors.mime_type}</div>}

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Registered Signature Preview</div>
                    <div className="mt-2 flex min-h-28 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2">
                        {registeredSignature !== '' ? (
                            <img
                                src={registeredSignature}
                                alt="Registered adviser e-signature"
                                className="max-h-24 w-auto object-contain"
                            />
                        ) : (
                            <span className="text-sm text-slate-500">No e-signature registered yet.</span>
                        )}
                    </div>
                </div>
            </div>

            {/* E-Signature Modal */}
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
                                          canvasProps={{ className: 'h-64 w-full' }}
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

                                      {registeredSignature !== '' && (
                                          <button
                                              type="button"
                                              onClick={removeSignature}
                                              disabled={signatureForm.processing}
                                              className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                                          >
                                              <Trash2 className="h-4 w-4" />
                                              Remove
                                          </button>
                                      )}

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
        </>
    );
};

export default ESignature;
