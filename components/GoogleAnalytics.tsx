import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

const GoogleAnalytics = () => {
    const location = useLocation();

    useEffect(() => {
        if (!GA_MEASUREMENT_ID) return;

        // Load Google Analytics Script
        const script1 = document.createElement('script');
        script1.async = true;
        script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
        document.head.appendChild(script1);

        const script2 = document.createElement('script');
        script2.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
                anonymize_ip: true
            });
        `;
        document.head.appendChild(script2);

        return () => {
            // Cleanup scripts on unmount if necessary
            document.head.removeChild(script1);
            document.head.removeChild(script2);
        };
    }, []);

    useEffect(() => {
        if (!GA_MEASUREMENT_ID || !window.gtag) return;

        // Track page view on route change
        window.gtag('config', GA_MEASUREMENT_ID, {
            page_path: location.pathname + location.search,
        });
    }, [location]);

    return null;
};

// Add gtag to global window type
declare global {
    interface Window {
        gtag: (command: string, id: string, config?: any) => void;
        dataLayer: any[];
    }
}

export default GoogleAnalytics;
