
import Cookies from 'js-cookie';

export const setCookie = (name: string, value: string, days: number = 7) => {
    try {
        Cookies.set(name, value, {
            expires: days,
            secure: process.env.NODE_ENV === 'production',
            // Allow top-level redirects (e.g. Stripe) to send cookies back
            sameSite: 'lax',
            path: '/'
        });

        // Verify cookie was set
        getCookie(name);
    } catch (error) {
        console.error(`❌ Failed to set cookie ${name}:`, error);
    }
};

export const getCookie = (name: string): string | null => {
    try {
        if (typeof document === 'undefined') return null;

        return Cookies.get(name) || null;
    } catch (error) {
        console.error(`❌ Failed to get cookie ${name}:`, error);
        return null;
    }
};

export const deleteCookie = (name: string) => {
    try {
        // Remove without domain (covers cookies set by setCookie above)
        Cookies.remove(name, { path: '/' });
        // Also remove with explicit domain variants (covers cookies set by OAuthCallbackHandler)
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            const parts = hostname.split('.');
            if (parts.length >= 2) {
                const rootDomain = '.' + parts.slice(-2).join('.');
                Cookies.remove(name, { path: '/', domain: rootDomain });
            }
            Cookies.remove(name, { path: '/', domain: hostname });
        }
    } catch (error) {
        console.error(`❌ Failed to delete cookie ${name}:`, error);
    }
};
