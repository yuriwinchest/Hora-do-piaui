import React, { useState } from 'react';
import { NewsItem } from '../types';
import NewsCard from '../components/NewsCard';
import { PageContainer } from '../components/common/PageContainer';
import { normalizeText } from '../utils/mappers';

interface NewsFeedPageProps {
    title: string;
    category?: string;
    items: NewsItem[];
}

const NewsFeedPage: React.FC<NewsFeedPageProps> = ({ title, category, items }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = items.filter(item => {
        const matchesCategory = category ? item.category === category : true;
        const matchesSearch =
            normalizeText(item.title).includes(normalizeText(searchTerm)) ||
            normalizeText(item.description || '').includes(normalizeText(searchTerm));
        return matchesCategory && matchesSearch;
    });

    return (
        <PageContainer title={title}>
            <div className="mb-8">
                <input
                    type="text"
                    placeholder={`Buscar em ${title}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full max-w-md px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black placeholder:font-bold placeholder:text-gray-300 font-bold text-gray-900"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredItems.map(item => (
                    <NewsCard key={item.id} item={item} />
                ))}
            </div>

            {filteredItems.length === 0 && (
                <div className="py-12 text-center text-gray-400 font-bold">
                    Nenhuma notícia encontrada.
                </div>
            )}
        </PageContainer>
    );
};

export default NewsFeedPage;
