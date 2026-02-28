import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Activity, LayoutDashboard, Menu, Settings, ShieldCheck, Users, X } from 'lucide-react';

type NavigationItem = {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
};

type AdminLayoutProps = {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
};

const navigationItems: NavigationItem[] = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Create Users', href: '/admin/users/create', icon: ShieldCheck },
    { label: 'System Settings', href: '/admin/system-settings', icon: Settings },
    { label: 'Audit Logs', href: '/admin/audit-logs', icon: Activity },
];

const AdminLayout = ({ title, subtitle, children }: AdminLayoutProps) => {
    const [isMobileOpen, setIsMobileOpen] = React.useState(false);
    const page = usePage();
    const currentUrl = page.url;

    React.useEffect(() => {
        setIsMobileOpen(false);
    }, [currentUrl]);

    const isActive = (href: string): boolean => {
        if (href === '/admin/users') {
            return currentUrl.startsWith('/admin/users');
        }

        return currentUrl === href || currentUrl.startsWith(`${href}/`);
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900">
            <button
                type="button"
                onClick={() => setIsMobileOpen((value) => !value)}
                className="fixed top-4 left-4 z-[60] inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow md:hidden"
                aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
            >
                {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <div
                className={`fixed inset-0 z-40 bg-slate-900/40 transition-opacity md:hidden ${isMobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                onClick={() => setIsMobileOpen(false)}
            />

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-slate-900 transition-transform md:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="border-b border-slate-800 px-6 py-5">
                    <p className="text-xs font-semibold tracking-[0.15em] text-slate-400 uppercase">CPMS</p>
                    <h1 className="mt-1 text-lg font-bold text-white">Admin Control</h1>
                </div>

                <nav className="flex-1 space-y-1 px-3 py-4">
                    {navigationItems.map((item) => {
                        const active = isActive(item.href);

                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                                    active ? 'bg-slate-100 text-slate-900' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            <main className="ml-0 flex-1 md:ml-64">
                <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 px-4 py-5 shadow-sm backdrop-blur md:px-8 md:py-6">
                    <h2 className="pl-12 text-xl font-bold md:pl-0 md:text-2xl">{title}</h2>
                    {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
                </header>

                <section className="p-4 md:p-8">{children}</section>
            </main>
        </div>
    );
};

export default AdminLayout;
