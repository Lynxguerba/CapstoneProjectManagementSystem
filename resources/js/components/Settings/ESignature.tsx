import { router, useForm } from '@inertiajs/react';
import { Eraser, PenTool, Trash2, Upload, X } from 'lucide-react';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import SignatureCanvas from 'react-signature-canvas';

type ESignatureProps = {
    initialSignature?: string;
    upsertUrl?: string;
    deleteUrl?: string;
};

const MAX_UPLOAD_IMAGE_SIDE = 1200;
const MIN_SIGNATURE_PIXEL_COUNT = 120;

const clamp = (value: number, minimum: number, maximum: number): number => {
    return Math.min(maximum, Math.max(minimum, value));
};

const histogramPercentile = (histogram: Uint32Array, total: number, percentile: number): number => {
    if (total === 0) {
        return 255;
    }

    const targetCount = Math.ceil(total * percentile);
    let cumulativeCount = 0;

    for (let value = 0; value < histogram.length; value += 1) {
        cumulativeCount += histogram[value];

        if (cumulativeCount >= targetCount) {
            return value;
        }
    }

    return 255;
};

const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(image);
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Unable to read the selected image.'));
        };

        image.src = objectUrl;
    });
};

const trimTransparentPadding = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
    const context = canvas.getContext('2d');
    if (context === null) {
        return canvas;
    }

    const { width, height } = canvas;
    const { data } = context.getImageData(0, 0, width, height);

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const alpha = data[(y * width + x) * 4 + 3];
            if (alpha === 0) {
                continue;
            }

            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }
    }

    if (maxX < minX || maxY < minY) {
        return canvas;
    }

    const padding = 12;
    const startX = Math.max(0, minX - padding);
    const startY = Math.max(0, minY - padding);
    const endX = Math.min(width, maxX + padding + 1);
    const endY = Math.min(height, maxY + padding + 1);

    const trimmedCanvas = document.createElement('canvas');
    trimmedCanvas.width = endX - startX;
    trimmedCanvas.height = endY - startY;

    const trimmedContext = trimmedCanvas.getContext('2d');
    if (trimmedContext === null) {
        return canvas;
    }

    trimmedContext.drawImage(canvas, startX, startY, endX - startX, endY - startY, 0, 0, endX - startX, endY - startY);

    return trimmedCanvas;
};

const removeIsolatedMaskPixels = (mask: Uint8Array, width: number, height: number): Uint8Array => {
    const cleanedMask = new Uint8Array(mask.length);

    for (let y = 0; y < height; y += 1) {
        const startY = Math.max(0, y - 1);
        const endY = Math.min(height - 1, y + 1);

        for (let x = 0; x < width; x += 1) {
            const pixelIndex = y * width + x;
            if (mask[pixelIndex] === 0) {
                continue;
            }

            const startX = Math.max(0, x - 1);
            const endX = Math.min(width - 1, x + 1);
            let neighborCount = 0;

            for (let neighborY = startY; neighborY <= endY; neighborY += 1) {
                for (let neighborX = startX; neighborX <= endX; neighborX += 1) {
                    if (neighborX === x && neighborY === y) {
                        continue;
                    }

                    const neighborIndex = neighborY * width + neighborX;
                    if (mask[neighborIndex] === 1) {
                        neighborCount += 1;
                    }
                }
            }

            if (neighborCount >= 2) {
                cleanedMask[pixelIndex] = 1;
            }
        }
    }

    return cleanedMask;
};

const collectConnectedComponent = (mask: Uint8Array, visited: Uint8Array, width: number, height: number, startIndex: number): number[] => {
    const componentPixels: number[] = [];
    const stack: number[] = [startIndex];
    visited[startIndex] = 1;

    while (stack.length > 0) {
        const currentIndex = stack.pop();
        if (currentIndex === undefined) {
            continue;
        }

        componentPixels.push(currentIndex);
        const y = Math.floor(currentIndex / width);
        const x = currentIndex - y * width;

        const startY = Math.max(0, y - 1);
        const endY = Math.min(height - 1, y + 1);
        const startX = Math.max(0, x - 1);
        const endX = Math.min(width - 1, x + 1);

        for (let neighborY = startY; neighborY <= endY; neighborY += 1) {
            for (let neighborX = startX; neighborX <= endX; neighborX += 1) {
                if (neighborX === x && neighborY === y) {
                    continue;
                }

                const neighborIndex = neighborY * width + neighborX;
                if (mask[neighborIndex] === 0 || visited[neighborIndex] === 1) {
                    continue;
                }

                visited[neighborIndex] = 1;
                stack.push(neighborIndex);
            }
        }
    }

    return componentPixels;
};

const removeSmallConnectedComponents = (mask: Uint8Array, width: number, height: number): Uint8Array => {
    const firstPassVisited = new Uint8Array(mask.length);
    let largestComponentArea = 0;

    for (let pixelIndex = 0; pixelIndex < mask.length; pixelIndex += 1) {
        if (mask[pixelIndex] === 0 || firstPassVisited[pixelIndex] === 1) {
            continue;
        }

        const componentPixels = collectConnectedComponent(mask, firstPassVisited, width, height, pixelIndex);
        if (componentPixels.length > largestComponentArea) {
            largestComponentArea = componentPixels.length;
        }
    }

    if (largestComponentArea === 0) {
        return mask;
    }

    const minimumComponentArea = Math.max(28, Math.round(largestComponentArea * 0.012));
    const secondPassVisited = new Uint8Array(mask.length);
    const keptMask = new Uint8Array(mask.length);

    for (let pixelIndex = 0; pixelIndex < mask.length; pixelIndex += 1) {
        if (mask[pixelIndex] === 0 || secondPassVisited[pixelIndex] === 1) {
            continue;
        }

        const componentPixels = collectConnectedComponent(mask, secondPassVisited, width, height, pixelIndex);
        if (componentPixels.length < minimumComponentArea && componentPixels.length !== largestComponentArea) {
            continue;
        }

        for (const componentPixelIndex of componentPixels) {
            keptMask[componentPixelIndex] = 1;
        }
    }

    return keptMask;
};

const normalizeUploadedSignature = async (file: File): Promise<{ dataUrl: string; isLowContrast: boolean }> => {
    const image = await loadImageFromFile(file);
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;

    if (sourceWidth <= 0 || sourceHeight <= 0) {
        throw new Error('Selected file does not contain a valid image.');
    }

    const longestSide = Math.max(sourceWidth, sourceHeight);
    const resizeRatio = Math.min(1, MAX_UPLOAD_IMAGE_SIDE / longestSide);
    const width = Math.max(1, Math.round(sourceWidth * resizeRatio));
    const height = Math.max(1, Math.round(sourceHeight * resizeRatio));

    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = width;
    sourceCanvas.height = height;

    const sourceContext = sourceCanvas.getContext('2d');
    if (sourceContext === null) {
        throw new Error('Unable to process the uploaded image.');
    }

    sourceContext.clearRect(0, 0, width, height);
    sourceContext.drawImage(image, 0, 0, width, height);

    const sourceImageData = sourceContext.getImageData(0, 0, width, height);
    const sourcePixels = sourceImageData.data;
    const histogram = new Uint32Array(256);
    let visiblePixelCount = 0;

    for (let index = 0; index < sourcePixels.length; index += 4) {
        const alpha = sourcePixels[index + 3];
        if (alpha < 8) {
            continue;
        }

        const red = sourcePixels[index];
        const green = sourcePixels[index + 1];
        const blue = sourcePixels[index + 2];
        const luminance = Math.round(red * 0.299 + green * 0.587 + blue * 0.114);
        histogram[luminance] += 1;
        visiblePixelCount += 1;
    }

    if (visiblePixelCount === 0) {
        throw new Error('The uploaded image is empty.');
    }

    const darkPercentile = histogramPercentile(histogram, visiblePixelCount, 0.06);
    const lightPercentile = histogramPercentile(histogram, visiblePixelCount, 0.94);
    const contrast = lightPercentile - darkPercentile;
    const isLowContrast = contrast < 60;

    const whitePoint = clamp(lightPercentile + (isLowContrast ? 16 : 8), 190, 255);
    const blackPoint = clamp(darkPercentile - (isLowContrast ? 14 : 6), 0, 195);
    const tonalRange = Math.max(24, whitePoint - blackPoint);

    const normalizedCanvas = document.createElement('canvas');
    normalizedCanvas.width = width;
    normalizedCanvas.height = height;

    const normalizedContext = normalizedCanvas.getContext('2d');
    if (normalizedContext === null) {
        throw new Error('Unable to finalize the signature image.');
    }

    const normalizedImageData = normalizedContext.createImageData(width, height);
    const normalizedPixels = normalizedImageData.data;

    for (let index = 0; index < sourcePixels.length; index += 4) {
        const alpha = sourcePixels[index + 3] / 255;
        if (alpha <= 0.01) {
            normalizedPixels[index + 3] = 0;
            continue;
        }

        const red = sourcePixels[index];
        const green = sourcePixels[index + 1];
        const blue = sourcePixels[index + 2];
        const luminance = red * 0.299 + green * 0.587 + blue * 0.114;

        const darkness = clamp((whitePoint - luminance) / tonalRange, 0, 1);
        const contrastBoost = isLowContrast ? Math.pow(darkness, 0.7) : Math.pow(darkness, 0.9);
        let outputAlpha = contrastBoost * alpha;

        if (outputAlpha < 0.08) {
            outputAlpha = 0;
        }

        const alphaByte = Math.round(clamp(outputAlpha, 0, 1) * 255);
        normalizedPixels[index] = 0;
        normalizedPixels[index + 1] = 0;
        normalizedPixels[index + 2] = 0;
        normalizedPixels[index + 3] = alphaByte;
    }

    const foregroundMask = new Uint8Array(width * height);
    for (let pixelIndex = 0; pixelIndex < foregroundMask.length; pixelIndex += 1) {
        const alphaByte = normalizedPixels[pixelIndex * 4 + 3];
        if (alphaByte >= 42) {
            foregroundMask[pixelIndex] = 1;
        }
    }

    const isolatedNoiseReducedMask = removeIsolatedMaskPixels(foregroundMask, width, height);
    const filteredMask = removeSmallConnectedComponents(isolatedNoiseReducedMask, width, height);
    let retainedPixelCount = 0;

    for (let pixelIndex = 0; pixelIndex < filteredMask.length; pixelIndex += 1) {
        const alphaOffset = pixelIndex * 4 + 3;
        if (filteredMask[pixelIndex] === 0) {
            normalizedPixels[alphaOffset] = 0;
            continue;
        }

        const boostedAlpha = Math.round(clamp(normalizedPixels[alphaOffset] * 1.35, 0, 255));
        if (boostedAlpha < 48) {
            normalizedPixels[alphaOffset] = 0;
            continue;
        }

        normalizedPixels[alphaOffset] = boostedAlpha;
        retainedPixelCount += 1;
    }

    if (retainedPixelCount < MIN_SIGNATURE_PIXEL_COUNT) {
        throw new Error('Signature strokes were not detected clearly. Please upload a sharper image.');
    }

    normalizedContext.putImageData(normalizedImageData, 0, 0);
    const trimmedCanvas = trimTransparentPadding(normalizedCanvas);

    return {
        dataUrl: trimmedCanvas.toDataURL('image/png'),
        isLowContrast,
    };
};

const ESignature = ({
    initialSignature = '',
    upsertUrl = '/adviser/settings/e-signature',
    deleteUrl = '/adviser/settings/e-signature',
}: ESignatureProps) => {
    const [showESignatureModal, setShowESignatureModal] = useState(false);
    const [isESignatureModalAppearing, setIsESignatureModalAppearing] = useState(false);
    const [registeredSignature, setRegisteredSignature] = useState(initialSignature);
    const [isSignaturePadEmpty, setIsSignaturePadEmpty] = useState(true);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [imageUploadMessage, setImageUploadMessage] = useState('');
    const [imageUploadError, setImageUploadError] = useState('');
    const signaturePadRef = useRef<SignatureCanvas | null>(null);
    const signatureUploadRef = useRef<HTMLInputElement | null>(null);

    const signatureForm = useForm({
        signature_data: '',
        mime_type: 'image/png',
    });

    useEffect(() => {
        setRegisteredSignature(initialSignature);
    }, [initialSignature]);

    useEffect(() => {
        if (!showESignatureModal) {
            setImageUploadError('');
            setImageUploadMessage('');
            setIsUploadingImage(false);
        }
    }, [showESignatureModal]);

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
            if (event.key !== 'Escape' || signatureForm.processing || isUploadingImage) return;
            setShowESignatureModal(false);
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [showESignatureModal, signatureForm.processing, isUploadingImage]);

    useEffect(() => {
        if (!showESignatureModal) {
            setIsESignatureModalAppearing(false);
            return;
        }

        setIsESignatureModalAppearing(false);
        const animationFrame = window.requestAnimationFrame(() => {
            setIsESignatureModalAppearing(true);
        });

        return () => {
            window.cancelAnimationFrame(animationFrame);
        };
    }, [showESignatureModal]);

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
        setImageUploadError('');
        setImageUploadMessage('');
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

    const openImagePicker = (): void => {
        if (signatureForm.processing || isUploadingImage) {
            return;
        }

        signatureUploadRef.current?.click();
    };

    const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (file === undefined) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            setImageUploadError('Please upload an image file (PNG, JPG, JPEG, or WEBP).');
            setImageUploadMessage('');
            return;
        }

        setImageUploadError('');
        setImageUploadMessage('');
        setIsUploadingImage(true);

        try {
            const { dataUrl, isLowContrast } = await normalizeUploadedSignature(file);

            if (signaturePadRef.current !== null) {
                signaturePadRef.current.clear();
                signaturePadRef.current.fromDataURL(dataUrl);
            }

            setIsSignaturePadEmpty(false);
            setImageUploadMessage(
                isLowContrast
                    ? 'Low-contrast image detected. Signature was auto-enhanced, denoised, and converted to transparent PNG.'
                    : 'Signature image uploaded, denoised, and converted to transparent PNG.',
            );
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unable to process the uploaded signature image.';
            setImageUploadError(errorMessage);
            setImageUploadMessage('');
        } finally {
            setIsUploadingImage(false);
        }
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
                        <div className="text-xs text-slate-500">Register or update your drawn or uploaded transparent e-signature.</div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setShowESignatureModal(true)}
                    className="mt-4 w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800"
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
                            <img src={registeredSignature} alt="Registered e-signature" className="max-h-24 w-auto object-contain" />
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
                          className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity duration-200 ${
                              isESignatureModalAppearing ? 'opacity-100' : 'opacity-0'
                          }`}
                          role="dialog"
                          aria-modal="true"
                          onMouseDown={(event) => {
                              if (event.target === event.currentTarget && !signatureForm.processing && !isUploadingImage) {
                                  setShowESignatureModal(false);
                              }
                          }}
                      >
                          <div
                              className={`max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-200 ${
                                  isESignatureModalAppearing ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
                              }`}
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
                                      disabled={signatureForm.processing || isUploadingImage}
                                      className="rounded-lg p-1.5 text-gray-600 transition-all duration-200 hover:rotate-90 hover:bg-gray-200"
                                  >
                                      <X className="h-5 w-5" />
                                  </button>
                              </div>

                              <div className="p-4">
                                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                      <p className="text-sm font-medium text-slate-700">
                                          Draw your signature or upload an image to auto-convert into a clear transparent signature.
                                      </p>
                                  </div>

                                  <div className="mt-3 flex flex-wrap items-center gap-2">
                                      <input
                                          ref={signatureUploadRef}
                                          type="file"
                                          accept="image/png,image/jpeg,image/jpg,image/webp"
                                          className="hidden"
                                          onChange={handleImageUpload}
                                      />

                                      <button
                                          type="button"
                                          onClick={openImagePicker}
                                          disabled={signatureForm.processing || isUploadingImage}
                                          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                          <Upload className="h-4 w-4" />
                                          {isUploadingImage ? 'Processing image...' : 'Upload Signature Image'}
                                      </button>

                                      <span className="text-xs text-slate-500">Best result: dark signature on light/plain background.</span>
                                  </div>

                                  {imageUploadMessage !== '' && <div className="mt-2 text-xs font-medium text-emerald-700">{imageUploadMessage}</div>}
                                  {imageUploadError !== '' && <div className="mt-2 text-xs font-medium text-rose-600">{imageUploadError}</div>}

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
                                          disabled={signatureForm.processing || isUploadingImage}
                                          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                      >
                                          <Eraser className="h-4 w-4" />
                                          Clear
                                      </button>

                                      {registeredSignature !== '' && (
                                          <button
                                              type="button"
                                              onClick={removeSignature}
                                              disabled={signatureForm.processing || isUploadingImage}
                                              className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                                          >
                                              <Trash2 className="h-4 w-4" />
                                              Remove
                                          </button>
                                      )}

                                      <button
                                          type="button"
                                          onClick={registerOrUpdateSignature}
                                          disabled={isSignaturePadEmpty || signatureForm.processing || isUploadingImage}
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
