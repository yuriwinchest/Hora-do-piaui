import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
}

export const SEO: React.FC<SEOProps> = ({ title, description, image, url, type = 'website' }) => {
    const siteTitle = 'Hora do Piauí';
    // Se o título já contiver o nome do site ou for muito longo, não adiciona o sufixo
    const fullTitle = title.includes('Hora do Piauí') ? title : `${title} | ${siteTitle}`;

    // Fallback image logic:
    // 1. Provided image (if valid)
    // 2. Default logo
    // Note: URL must be absolute for OG tags to work properly
    const baseUrl = 'https://horapiaui.com';
    const defaultImage = `${baseUrl}/assets/logo.png`;

    // Ensure image is absolute URL
    let imageUrl = image;
    if (image && !image.startsWith('http')) {
        imageUrl = `${baseUrl}${image.startsWith('/') ? '' : '/'}${image}`;
    }
    // If no image provided, fallback to logo
    if (!imageUrl) {
        imageUrl = defaultImage;
    }



    const currentUrl = url || window.location.href.replace('https://www.horapiaui.com', baseUrl);

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={description || 'Notícias atualizadas do Piauí e do Brasil.'} />
            <link rel="canonical" href={currentUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description || 'Notícias atualizadas do Piauí e do Brasil.'} />
            <meta property="og:image" content={`${baseUrl}/api/og?title=${encodeURIComponent(title)}&image=${encodeURIComponent(imageUrl)}`} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:site_name" content={siteTitle} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={currentUrl} />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description || 'Notícias atualizadas do Piauí e do Brasil.'} />
            <meta name="twitter:image" content={`${baseUrl}/api/og?title=${encodeURIComponent(title)}&image=${encodeURIComponent(imageUrl)}`} />
        </Helmet>
    );
};
