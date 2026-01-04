export const calculateReadingTime = (text: string | undefined): string => {
    if (!text) return '1 min de leitura';
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min de leitura`;
};

export const getNewsSchema = (item: any) => {
    return {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": item.title,
        "image": [item.image],
        "datePublished": item.date, // Idealmente ISO format
        "author": [{
            "@type": "Person",
            "name": item.authorName || "Redação Hora do Piauí"
        }]
    };
};
