import React from 'react';
import { NewsItem } from '../../types';
import NewsCard from '../NewsCard';

interface NewsCardPreviewProps {
    item: Partial<NewsItem>;
}

const NewsCardPreview: React.FC<NewsCardPreviewProps> = ({ item }) => {
    // Ensure we have a valid object for NewsCard
    const previewItem: NewsItem = {
        id: item.id || 'preview',
        title: item.title || 'Título da Notícia',
        image: item.image || 'https://images.unsplash.com/photo-1504711432869-d635738bb448?q=80&w=1000&auto=format&fit=crop',
        description: item.description || 'Breve descrição da notícia...',
        date: item.date || '01/01/2026',
        time: item.time || '00:00',
        category: item.category || 'geral',
        section: item.section || 'GERAL',
        status: item.status || 'draft'
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2">
                Preview do Card
            </h3>
            <div className="max-w-[350px] mx-auto">
                <NewsCard item={previewItem} />
            </div>
        </div>
    );
};

export default NewsCardPreview;
