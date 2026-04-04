import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import '../css/app.css';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
const ROOT_ATTRIBUTE = '__cpms_react_root__';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const rootHost = el as HTMLElement & {
            [ROOT_ATTRIBUTE]?: Root;
        };
        const root = rootHost[ROOT_ATTRIBUTE] ?? createRoot(el);
        rootHost[ROOT_ATTRIBUTE] = root;

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
