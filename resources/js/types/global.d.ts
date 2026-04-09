import { route as routeFn } from 'ziggy-js';

declare global {
    const route: typeof routeFn;
}

import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { AxiosInstance } from 'axios';

declare module '@inertiajs/core' {
    interface PageProps extends InertiaPageProps, AppPageProps {}
}

export interface AppPageProps {
    auth: {
        user: AuthUser | null;
    };
    flash: {
        success: string | null;
        error: string | null;
    };
    unread_notifications_count: number;
    [key: string]: unknown;
}

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
}
