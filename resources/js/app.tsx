/// <reference types="vite/client" />
import '../css/app.css';
import './echo';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { configureEcho } from '@laravel/echo-react';

configureEcho({
    broadcaster: 'pusher',
});

const appName = import.meta.env.VITE_APP_NAME || 'Gerenciador Financeiro';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Cast necessário: resolvePageComponent retorna Promise<module> mas Inertia espera Promise<Component>
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ) as any,
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#22c55e',
    },
});
