import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    server: {
        host: '0.0.0.0',   
        port: 5173,
        strictPort: true,
        cors: true,
        hmr: {
            host: process.env.CODESPACE_NAME ? `${process.env.CODESPACE_NAME}-5173.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}` : 'localhost',
            protocol: process.env.CODESPACE_NAME ? 'wss' : 'ws',
            clientPort: process.env.CODESPACE_NAME ? 443 : 5173,
        },
        origin: process.env.CODESPACE_NAME ? `https://${process.env.CODESPACE_NAME}-5173.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}` : undefined,
    },
    esbuild: {
        jsx: 'automatic',
    },
});
