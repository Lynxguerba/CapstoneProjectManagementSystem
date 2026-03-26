import { useForm } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BadgeCheck, CheckCircle2, Mail, X } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type RegisterPanelProps = {
    onBack: () => void;
    onRegistered: (message: string) => void;
};

type RegistrationRole = 'student' | 'adviser' | 'panelist' | 'instructor' | 'dean' | 'program_chairperson';
type RegistrationStep = 'details' | 'security';
type ProgramOption = 'BSIT' | 'BSIS';
type RegistrationRoleValue = RegistrationRole | '';

type RegisterForm = {
    first_name: string;
    last_name: string;
    email: string;
    role: RegistrationRoleValue;
    program: ProgramOption | '';
    password: string;
    password_confirmation: string;
};

const roleOptions: Array<{ value: RegistrationRole; label: string }> = [
    { value: 'student', label: 'Student' },
    { value: 'adviser', label: 'Adviser' },
    { value: 'panelist', label: 'Panelist' },
    { value: 'instructor', label: 'Instructor' },
    { value: 'dean', label: 'Dean' },
    { value: 'program_chairperson', label: 'Panel Chair' },
];

const programOptions: ProgramOption[] = ['BSIT', 'BSIS'];

const primaryActionClassName =
    'group relative isolate inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-green-700 px-5 py-3.5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:from-emerald-500 hover:to-green-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/25 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50';

const secondaryActionClassName =
    'inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50';

const normalizeEmailPart = (value: string): string => {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.+|\.+$/g, '');
};

const buildInstitutionalEmail = (firstName: string, lastName: string): string => {
    const normalizedLastName = normalizeEmailPart(lastName);
    const normalizedFirstName = normalizeEmailPart(firstName);
    const generatedLocal = [normalizedLastName, normalizedFirstName].filter((value) => value !== '').join('.');

    return generatedLocal !== '' ? `${generatedLocal}@dnsc.ic.ph` : 'lastname.firstname@dnsc.ic.ph';
};

const requiresProgramSelection = (role: RegistrationRoleValue): boolean => {
    return role === 'student' || role === 'program_chairperson';
};

const RegisterPanel = ({ onBack, onRegistered }: RegisterPanelProps) => {
    const formRef = useRef<HTMLFormElement | null>(null);
    const [step, setStep] = useState<RegistrationStep>('details');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isConfirmAppearing, setIsConfirmAppearing] = useState(false);
    const [passwordConfirmationError, setPasswordConfirmationError] = useState('');
    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        first_name: '',
        last_name: '',
        email: '',
        role: '',
        program: '',
        password: '',
        password_confirmation: '',
    });

    const generatedEmail = useMemo(() => {
        return buildInstitutionalEmail(data.first_name, data.last_name);
    }, [data.first_name, data.last_name]);

    const selectedRoleLabel = useMemo(() => {
        return roleOptions.find((option) => option.value === data.role)?.label ?? 'Not selected';
    }, [data.role]);

    useEffect(() => {
        if (passwordConfirmationError === '') {
            return;
        }

        if (data.password === data.password_confirmation) {
            setPasswordConfirmationError('');
        }
    }, [data.password, data.password_confirmation, passwordConfirmationError]);

    useEffect(() => {
        if (requiresProgramSelection(data.role)) {
            return;
        }

        if (data.program !== '') {
            setData('program', '');
        }
    }, [data.program, data.role, setData]);

    useEffect(() => {
        if (!isConfirmOpen || typeof document === 'undefined') {
            setIsConfirmAppearing(false);
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !processing) {
                setIsConfirmOpen(false);
            }
        };

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKeyDown);

        setIsConfirmAppearing(false);
        const animationFrame = window.requestAnimationFrame(() => {
            setIsConfirmAppearing(true);
        });

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', onKeyDown);
            window.cancelAnimationFrame(animationFrame);
        };
    }, [isConfirmOpen, processing]);

    const handleContinue = (): void => {
        if (!formRef.current?.reportValidity()) {
            return;
        }

        setStep('security');
    };

    const handlePrepareRegistration = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        setPasswordConfirmationError('');

        if (!event.currentTarget.reportValidity()) {
            return;
        }

        if (data.password !== data.password_confirmation) {
            setPasswordConfirmationError('Password confirmation does not match.');
            return;
        }

        setIsConfirmOpen(true);
    };

    const submitRegistration = (): void => {
        post('/register', {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                reset();
                setStep('details');
                setShowPassword(false);
                setShowPasswordConfirmation(false);
                setPasswordConfirmationError('');
                setIsConfirmOpen(false);
                onRegistered('Registration request submitted. Wait for admin approval before signing in.');
            },
            onError: (formErrors) => {
                setIsConfirmOpen(false);
                const shouldReturnToDetails = ['first_name', 'last_name', 'email'].some((fieldName) =>
                    Object.prototype.hasOwnProperty.call(formErrors, fieldName),
                );

                setStep(shouldReturnToDetails ? 'details' : 'security');
            },
        });
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                className="flex min-h-full flex-col justify-center space-y-5 pb-1"
            >
                <form ref={formRef} className="space-y-4" onSubmit={handlePrepareRegistration}>
                    <AnimatePresence mode="wait" initial={false}>
                        {step === 'details' ? (
                            <motion.div
                                key="register-step-details"
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 12 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                className="space-y-4"
                            >
                                <div className="animate-fade-in-down text-center">
                                    <h2 className="text-2sm font-bold text-gray-900">Register Your Account</h2>
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="animate-fade-in-up relative" style={{ animationDelay: '0.1s' }}>
                                        <input
                                            id="register-first-name"
                                            name="first_name"
                                            required
                                            value={data.first_name}
                                            onChange={(event) => setData('first_name', event.target.value)}
                                            className="peer block w-full appearance-none rounded-lg border-2 border-gray-200 px-3 py-3 text-sm text-gray-900 placeholder-transparent transition-all duration-300 hover:border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 focus:outline-none"
                                            placeholder="First Name"
                                        />
                                        <label
                                            htmlFor="register-first-name"
                                            className={`pointer-events-none absolute left-3 transition-all duration-300 ${
                                                data.first_name
                                                    ? '-top-2 bg-white px-1 text-xs font-medium text-green-600'
                                                    : 'top-3 text-sm text-gray-500 peer-focus:-top-2 peer-focus:bg-white peer-focus:px-1 peer-focus:text-xs peer-focus:font-medium peer-focus:text-green-600'
                                            }`}
                                        >
                                            First Name
                                        </label>
                                        {errors.first_name ? <p className="mt-2 text-xs text-rose-600">{errors.first_name}</p> : null}
                                    </div>

                                    <div className="animate-fade-in-up relative" style={{ animationDelay: '0.2s' }}>
                                        <input
                                            id="register-last-name"
                                            name="last_name"
                                            required
                                            value={data.last_name}
                                            onChange={(event) => setData('last_name', event.target.value)}
                                            className="peer block w-full appearance-none rounded-lg border-2 border-gray-200 px-3 py-3 text-sm text-gray-900 placeholder-transparent transition-all duration-300 hover:border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 focus:outline-none"
                                            placeholder="Last Name"
                                        />
                                        <label
                                            htmlFor="register-last-name"
                                            className={`pointer-events-none absolute left-3 transition-all duration-300 ${
                                                data.last_name
                                                    ? '-top-2 bg-white px-1 text-xs font-medium text-green-600'
                                                    : 'top-3 text-sm text-gray-500 peer-focus:-top-2 peer-focus:bg-white peer-focus:px-1 peer-focus:text-xs peer-focus:font-medium peer-focus:text-green-600'
                                            }`}
                                        >
                                            Last Name
                                        </label>
                                        {errors.last_name ? <p className="mt-2 text-xs text-rose-600">{errors.last_name}</p> : null}
                                    </div>
                                </div>

                                <div
                                    className="animate-fade-in-up rounded-[24px] border border-emerald-100 bg-[linear-gradient(180deg,#f7fff9_0%,#ecfdf3_100%)] p-4"
                                    style={{ animationDelay: '0.3s' }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                                            <Mail className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold tracking-[0.18em] text-emerald-700 uppercase">Institutional email</p>
                                            <p className="mt-2 text-sm font-semibold break-all text-slate-900">{generatedEmail}</p>
                                            <p className="mt-2 text-xs leading-5 text-slate-500">
                                                Your email address is generated from your first and last name and will be used for account approval.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {errors.email ? <p className="text-xs text-rose-600">{errors.email}</p> : null}

                                <div className="grid items-center gap-3 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={onBack}
                                        className={`${secondaryActionClassName} animate-fade-in-up`}
                                        style={{ animationDelay: '0.4s' }}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Back to Login
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleContinue}
                                        className={`${primaryActionClassName} animate-fade-in-up`}
                                        style={{ animationDelay: '0.45s' }}
                                    >
                                        <span className="animate-shine pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                                        <span className="relative z-10 flex items-center gap-2">
                                            Continue
                                            <ArrowRight className="h-4 w-4" />
                                        </span>
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="register-step-security"
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -12 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                className="space-y-4"
                            >
                                <div className="animate-fade-in-down text-center">
                                    <h2 className="text-2sm font-bold text-gray-900">Register Your Account</h2>
                                </div>
                                <div className="space-y-4">
                                    <div className="animate-fade-in-up relative" style={{ animationDelay: '0.1s' }}>
                                        <div className="group relative w-full">
                                            <select
                                                id="register-role"
                                                name="role"
                                                required
                                                value={data.role}
                                                onChange={(event) => setData('role', event.target.value as RegistrationRoleValue)}
                                                className="peer block w-full appearance-none rounded-lg border-2 border-gray-200 bg-gray-50/50 px-3 py-3 text-sm text-gray-900 transition-all duration-300 hover:border-green-200 hover:bg-white focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 focus:outline-none"
                                            >
                                                <option value="" disabled hidden></option>
                                                {roleOptions.map((roleOption) => (
                                                    <option key={roleOption.value} value={roleOption.value}>
                                                        {roleOption.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <label
                                                htmlFor="register-role"
                                                className={`pointer-events-none absolute left-3 transition-all duration-300 ${
                                                    data.role
                                                        ? '-top-2 bg-white px-1 text-xs font-medium text-green-600'
                                                        : 'top-1/2 -translate-y-1/2 text-sm text-gray-500 peer-focus:-top-2 peer-focus:translate-y-0 peer-focus:bg-white peer-focus:px-1 peer-focus:text-xs peer-focus:font-medium peer-focus:text-green-600'
                                                }`}
                                            >
                                                Select Role
                                            </label>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition-transform duration-300 peer-focus:rotate-180 peer-focus:text-green-500">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                        {errors.role ? <p className="mt-2 text-xs text-rose-600">{errors.role}</p> : null}
                                    </div>

                                    {requiresProgramSelection(data.role) ? (
                                        <div className="animate-fade-in-up relative" style={{ animationDelay: '0.15s' }}>
                                            <div className="group relative w-full">
                                                <select
                                                    id="register-program"
                                                    name="program"
                                                    required
                                                    value={data.program}
                                                    onChange={(event) => setData('program', event.target.value as ProgramOption | '')}
                                                    className="peer block w-full appearance-none rounded-lg border-2 border-gray-200 bg-gray-50/50 px-3 py-3 text-sm text-gray-900 transition-all duration-300 hover:border-green-200 hover:bg-white focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 focus:outline-none"
                                                >
                                                    <option value="" disabled hidden></option>
                                                    {programOptions.map((programOption) => (
                                                        <option key={programOption} value={programOption}>
                                                            {programOption}
                                                        </option>
                                                    ))}
                                                </select>
                                                <label
                                                    htmlFor="register-program"
                                                    className={`pointer-events-none absolute left-3 transition-all duration-300 ${
                                                        data.program !== ''
                                                            ? '-top-2 bg-white px-1 text-xs font-medium text-green-600'
                                                            : 'top-1/2 -translate-y-1/2 text-sm text-gray-500 peer-focus:-top-2 peer-focus:translate-y-0 peer-focus:bg-white peer-focus:px-1 peer-focus:text-xs peer-focus:font-medium peer-focus:text-green-600'
                                                    }`}
                                                >
                                                    Program Selection
                                                </label>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition-transform duration-300 peer-focus:rotate-180 peer-focus:text-green-500">
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                            {errors.program ? <p className="mt-2 text-xs text-rose-600">{errors.program}</p> : null}
                                        </div>
                                    ) : null}

                                    <div className="animate-fade-in-up relative" style={{ animationDelay: '0.2s' }}>
                                        <div className="relative">
                                            <input
                                                id="register-password"
                                                name="password"
                                                type={showPassword ? 'text' : 'password'}
                                                autoComplete="new-password"
                                                required
                                                minLength={8}
                                                value={data.password}
                                                onChange={(event) => setData('password', event.target.value)}
                                                className="peer block w-full appearance-none rounded-lg border-2 border-gray-200 px-3 py-3 pr-10 text-sm text-gray-900 placeholder-transparent transition-all duration-300 hover:border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 focus:outline-none"
                                                placeholder="Create Password"
                                            />
                                            <label
                                                htmlFor="register-password"
                                                className={`pointer-events-none absolute left-3 transition-all duration-300 ${
                                                    data.password
                                                        ? '-top-2 bg-white px-1 text-xs font-medium text-green-600'
                                                        : 'top-3 text-sm text-gray-500 peer-focus:-top-2 peer-focus:bg-white peer-focus:px-1 peer-focus:text-xs peer-focus:font-medium peer-focus:text-green-600'
                                                }`}
                                            >
                                                Create Password
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((previousState) => !previousState)}
                                                className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-gray-400 hover:text-green-600 focus:outline-none"
                                            >
                                                {showPassword ? (
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7 1.02-2.29 2.86-4.22 5.13-5.44M9.88 9.88A3 3 0 1114.12 14.12M6.1 6.1L17.9 17.9"
                                                        />
                                                    </svg>
                                                ) : (
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                        />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                        {errors.password ? <p className="mt-2 text-xs text-rose-600">{errors.password}</p> : null}
                                    </div>

                                    <div className="animate-fade-in-up relative" style={{ animationDelay: '0.3s' }}>
                                        <div className="relative">
                                            <input
                                                id="register-password-confirmation"
                                                name="password_confirmation"
                                                type={showPasswordConfirmation ? 'text' : 'password'}
                                                autoComplete="new-password"
                                                required
                                                minLength={8}
                                                value={data.password_confirmation}
                                                onChange={(event) => setData('password_confirmation', event.target.value)}
                                                className="peer block w-full appearance-none rounded-lg border-2 border-gray-200 px-3 py-3 pr-10 text-sm text-gray-900 placeholder-transparent transition-all duration-300 hover:border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 focus:outline-none"
                                                placeholder="Confirm Password"
                                            />
                                            <label
                                                htmlFor="register-password-confirmation"
                                                className={`pointer-events-none absolute left-3 transition-all duration-300 ${
                                                    data.password_confirmation
                                                        ? '-top-2 bg-white px-1 text-xs font-medium text-green-600'
                                                        : 'top-3 text-sm text-gray-500 peer-focus:-top-2 peer-focus:bg-white peer-focus:px-1 peer-focus:text-xs peer-focus:font-medium peer-focus:text-green-600'
                                                }`}
                                            >
                                                Confirm Password
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswordConfirmation((previousState) => !previousState)}
                                                className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-gray-400 hover:text-green-600 focus:outline-none"
                                            >
                                                {showPasswordConfirmation ? (
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7 1.02-2.29 2.86-4.22 5.13-5.44M9.88 9.88A3 3 0 1114.12 14.12M6.1 6.1L17.9 17.9"
                                                        />
                                                    </svg>
                                                ) : (
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                        />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                        {passwordConfirmationError !== '' ? (
                                            <p className="mt-2 text-xs text-rose-600">{passwordConfirmationError}</p>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="grid items-center gap-3 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep('details')}
                                        className={`${secondaryActionClassName} animate-fade-in-up`}
                                        style={{ animationDelay: '0.4s' }}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className={`${primaryActionClassName} animate-fade-in-up`}
                                        style={{ animationDelay: '0.45s' }}
                                    >
                                        <span className="animate-shine pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                                        <span className="relative z-10 flex items-center gap-2">
                                            {processing ? 'Submitting...' : 'Submit'}
                                            <CheckCircle2 className="h-4 w-4" />
                                        </span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>
            </motion.div>

            {typeof document === 'undefined' || !isConfirmOpen
                ? null
                : createPortal(
                      <div
                          className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity duration-200 ${
                              isConfirmAppearing ? 'opacity-100' : 'opacity-0'
                          }`}
                          role="dialog"
                          aria-modal="true"
                          onMouseDown={(event) => {
                              if (event.target === event.currentTarget && !processing) {
                                  setIsConfirmOpen(false);
                              }
                          }}
                      >
                          <div
                              className={`max-h-[90vh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-200 ${
                                  isConfirmAppearing ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
                              }`}
                              onMouseDown={(event) => event.stopPropagation()}
                          >
                              <div className="flex items-center justify-between border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-100 px-4 py-3">
                                  <div className="flex items-center gap-2">
                                      <BadgeCheck className="h-5 w-5 text-emerald-800" />
                                      <h3 className="text-lg font-bold text-emerald-900">Confirm Registration</h3>
                                  </div>
                                  <button
                                      type="button"
                                      onClick={() => setIsConfirmOpen(false)}
                                      disabled={processing}
                                      className="rounded-lg p-1.5 text-emerald-700 transition-all duration-200 hover:rotate-90 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                      <X className="h-5 w-5" />
                                  </button>
                              </div>

                              <div className="space-y-4 p-4">
                                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                                      <div className="flex items-center gap-3">
                                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-sm">
                                              <CheckCircle2 className="h-5 w-5" />
                                          </div>
                                          <div>
                                              <p className="text-sm font-bold text-emerald-900">Proceed with this access request?</p>
                                              <p className="text-xs text-emerald-800">
                                                  Your account will remain pending until an administrator reviews the details below.
                                              </p>
                                          </div>
                                      </div>
                                  </div>

                                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                      <div className="flex items-center justify-between gap-3 text-sm">
                                          <span className="text-slate-500">Name</span>
                                          <span className="font-semibold text-slate-800">
                                              {data.first_name} {data.last_name}
                                          </span>
                                      </div>
                                      <div className="flex items-center justify-between gap-3 text-sm">
                                          <span className="text-slate-500">Email</span>
                                          <span className="text-right font-semibold break-all text-slate-800">{generatedEmail}</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-3 text-sm">
                                          <span className="text-slate-500">Role</span>
                                          <span className="font-semibold text-slate-800">{selectedRoleLabel}</span>
                                      </div>
                                  </div>
                              </div>

                              <div className="border-t border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-100 px-4 py-3">
                                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                      <button
                                          type="button"
                                          onClick={() => setIsConfirmOpen(false)}
                                          disabled={processing}
                                          className="inline-flex flex-1 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                          Cancel
                                      </button>
                                      <button
                                          type="button"
                                          onClick={submitRegistration}
                                          disabled={processing}
                                          className={`${primaryActionClassName} sm:flex-1`}
                                      >
                                          <span className="animate-shine pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                                          <span className="relative z-10 flex items-center gap-2">
                                              {processing ? 'Submitting...' : 'Confirm Registration'}
                                              <CheckCircle2 className="h-4 w-4" />
                                          </span>
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </div>,
                      document.body,
                  )}
        </>
    );
};

export default RegisterPanel;