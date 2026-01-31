import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Clock, BarChart } from 'lucide-react';
import { NewsItem } from '../types';
import { normalizeText } from '../utils/mappers';
import { calculateReadingTime } from '../utils/seo';

interface TabbedNewsSectionProps {
    items: NewsItem[];
    marianoConfig: {
        mainId: string;
        listIds: string[];
    };
}

type Tab = 'mariano' | 'politica' | 'geral';

const TabbedNewsSection: React.FC<TabbedNewsSectionProps> = ({ items, marianoConfig }) => {
    const [activeTab, setActiveTab] = useState<Tab>('mariano');

    // Filter and Sort Logic for Politics
    const politicsItems = useMemo(() => {
        const now = new Date();
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(now.getDate() - 5);

        // 1. Filter: Politics category + Last 5 days (relaxed to just Politics for demo if dates are strings)
        let filtered = items.filter(i => {
            const cat = normalizeText(i.category || '');
            const sec = normalizeText(i.section || '');
            return cat === 'politica' || sec === 'politica';
        });

        // 2. Scoring Algorithm
        // Relevance (60%) - Assumed by being in the category
        // Engagement (30%) - Proxy: isLarge (highlighted)
        // Freshness (10%) - Recent date
        return filtered.map(item => {
            let score = 60; // Base for being in category
            if (item.isLarge) score += 30;
            // Date parsing would go here for freshness +10
            return { ...item, score };
        }).sort((a, b) => b.score - a.score).slice(0, 5); // Top 5
    }, [items]);

    // General Items (Fallback logic)
    const generalItems = useMemo(() => {
        return items.filter(i => normalizeText(i.category || '') === 'geral').slice(0, 5);
    }, [items]);

    // Data Resolution based on Tab
    const { mainItem, listItems } = useMemo(() => {
        if (activeTab === 'mariano') {
            const main = marianoConfig.mainId ? items.find(i => i.id === marianoConfig.mainId) : items[4];
            const list = marianoConfig.listIds.length > 0
                ? marianoConfig.listIds.map(id => items.find(i => i.id === id)).filter((i): i is NewsItem => !!i)
                : items.slice(5, 9);
            return { mainItem: main, listItems: list };
        } else if (activeTab === 'politica') {
            return {
                mainItem: politicsItems[0],
                listItems: politicsItems.slice(1, 5)
            };
        } else {
            return {
                mainItem: generalItems[0],
                listItems: generalItems.slice(1, 5)
            };
        }
    }, [activeTab, items, marianoConfig, politicsItems, generalItems]);

    return (
        <section className="mb-16">
            {/* Tabs Navigation */}
            <div className="flex gap-6 border-b border-gray-100 mb-8 pb-2 text-sm md:text-base font-black uppercase tracking-widest overflow-x-auto">
                <button
                    onClick={() => setActiveTab('mariano')}
                    className={`pb-2 transition-colors whitespace-nowrap ${activeTab === 'mariano' ? 'text-black border-b-2 border-black' : 'text-black hover:opacity-70'}`}
                >
                    Coluna Mariano Wikoli
                </button>
                <button
                    onClick={() => setActiveTab('politica')}
                    className={`pb-2 transition-colors whitespace-nowrap ${activeTab === 'politica' ? 'text-black border-b-2 border-black' : 'text-black hover:opacity-70'}`}
                >
                    Política
                </button>
                <button
                    onClick={() => setActiveTab('geral')}
                    className={`pb-2 transition-colors whitespace-nowrap ${activeTab === 'geral' ? 'text-black border-b-2 border-black' : 'text-black hover:opacity-70'}`}
                >
                    Geral
                </button>
            </div>

            {/* Content Area with Animation */}
            <div className="grid grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 key={activeTab}">

                {/* Main Card (Left) */}
                <div className="col-span-12 lg:col-span-8">
                    {mainItem ? (
                        <Link to={`/noticia/${mainItem.slug || mainItem.id}`} className="group block relative overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500">
                            {mainItem.image ? (
                                <>
                                    <div className="aspect-video overflow-hidden">
                                        <img
                                            src={mainItem.image}
                                            alt={mainItem.title}
                                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                            referrerPolicy="no-referrer"
                                            loading="eager"
                                        />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90" />
                                    <div className="absolute bottom-0 left-0 w-full p-4 md:p-8 text-white">
                                        <div className="flex items-center gap-2 mb-2 md:mb-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transform md:translate-y-2 md:group-hover:translate-y-0 transition-all duration-500">
                                            <span className="bg-[#16a34a] text-[10px] font-black uppercase px-2 py-1 rounded">
                                                {mainItem.category || 'Destaque'}
                                            </span>
                                            <span className="text-xs font-bold flex items-center gap-1">
                                                <Clock size={12} /> {calculateReadingTime(mainItem.content)}
                                            </span>
                                        </div>
                                        <h3 className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-black font-serif leading-tight mb-1 md:mb-2 group-hover:text-[#16a34a] transition-colors">
                                            {mainItem.title}
                                        </h3>
                                        <p className="text-gray-200 line-clamp-2 font-medium max-w-2xl text-sm md:text-base hidden md:block">
                                            {mainItem.description}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="bg-white flex flex-col justify-start items-start p-4 text-left text-black h-auto">
                                    <h3 className="text-xl md:text-3xl font-black font-serif leading-tight mb-2">
                                        <span className="bg-[#16a34a] text-white px-2 box-decoration-clone leading-normal py-1 rounded-sm">
                                            {mainItem.title}
                                        </span>
                                    </h3>
                                    <p className="text-gray-600 line-clamp-3 font-medium max-w-2xl text-base hidden md:block mt-2">
                                        {mainItem.description}
                                    </p>
                                </div>
                            )}
                        </Link>
                    ) : (
                        <div className="h-96 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
                            Sem destaque disponível
                        </div>
                    )}
                </div>

                {/* Side List (Right) */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-y-auto max-h-[600px] pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                    {listItems.length > 0 ? (
                        listItems.map((item, idx) => (
                            <Link
                                key={item.id}
                                to={`/noticia/${item.slug || item.id}`}
                                className="group flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                            >
                                {item.image ? (
                                    <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 relative">
                                        <img
                                            src={item.image}
                                            alt=""
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            referrerPolicy="no-referrer"
                                            loading="lazy"
                                        />
                                        <div className="absolute top-1 left-1 bg-black/50 backdrop-blur-sm text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                                            {idx + 1}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 flex-shrink-0 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center relative text-center p-2">
                                        <span className="text-[#16a34a] text-[10px] font-black uppercase">
                                            {item.category || 'HP'}
                                        </span>
                                        <div className="absolute top-1 left-1 bg-black/10 backdrop-blur-sm text-black text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                                            {idx + 1}
                                        </div>
                                    </div>
                                )}
                                <div className="flex flex-col justify-center">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 group-hover:text-[#16a34a] transition-colors">
                                        {item.category || 'Notícia'}
                                    </span>
                                    <h4 className="font-black text-black leading-snug line-clamp-3 group-hover:text-[#16a34a] transition-colors">
                                        {item.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Clock size={10} /> {calculateReadingTime(item.content)}
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <p className="text-gray-500 text-sm text-center py-10">Nenhuma notícia encontrada nesta seção.</p>
                    )}
                </div>
            </div>
        </section>
    );
};

export default TabbedNewsSection;
