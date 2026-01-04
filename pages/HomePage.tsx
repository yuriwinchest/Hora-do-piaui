import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { NewsItem, HomeLayoutConfig } from '../types';
import NewsCard from '../components/NewsCard';
import NewsListItem from '../components/NewsListItem';
import VideoCard from '../components/VideoCard';
import GamesBanner from '../components/GamesBanner';
import AdBanner from '../components/AdBanner';
import { supabase } from '../lib/supabase';

interface HomePageProps {
    items: NewsItem[];
    config: HomeLayoutConfig;
}

const HomePage: React.FC<HomePageProps> = ({ items, config }) => {
    const [latestVideos, setLatestVideos] = useState<any[]>([]);

    useEffect(() => {
        const fetchVideos = async () => {
            const { data } = await supabase.from('horapiaui_videos').select('*').order('created_at', { ascending: false }).limit(5);
            if (data) setLatestVideos(data);
        };
        fetchVideos();
    }, []);

    // Map config IDs to items
    const leftGridItems = config.heroTopIds
        .map(id => items.find(item => item.id === id))
        .filter((item): item is NewsItem => !!item);

    const rightSideItems = config.heroSideIds
        .map(id => items.find(item => item.id === id))
        .filter((item): item is NewsItem => !!item);

    // Fallback if config is empty (only if no IDs configured)
    const effectiveLeftItems = leftGridItems.length > 0 ? leftGridItems : items.slice(0, 2);
    const effectiveRightItems = rightSideItems.length > 0 ? rightSideItems : items.slice(2, 4);

    // Mariano Section
    const marianoMain = config.marianoMainId
        ? items.find(i => i.id === config.marianoMainId)
        : items[4];

    const marianoList = config.marianoListIds.length > 0
        ? config.marianoListIds.map(id => items.find(i => i.id === id)).filter((i): i is NewsItem => !!i)
        : items.slice(5, 9);

    return (
        <main className="max-w-7xl mx-auto px-4 py-8">
            {/* Título Principal Green Box */}
            <div className="bg-[#16a34a] px-4 py-2 mb-6 inline-block">
                <h1 className="text-white text-3xl font-bold font-serif">
                    {config.mainHeadline || "Manchete Principal"}
                </h1>
            </div>

            {/* Grid Destaque: 2 Colunas (2 Main + Sidebar) */}
            <section className="grid grid-cols-12 gap-6 mb-12">
                <div className="col-span-12 lg:col-span-8 grid grid-cols-2 gap-4">
                    {effectiveLeftItems.map(news => (
                        <Link to={`/noticia/${news.id}`} key={news.id} className="group block">
                            <div className="overflow-hidden rounded mb-2">
                                <img src={news.image} className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                            </div>
                            <h2 className="text-lg font-bold font-serif leading-tight group-hover:text-[#16a34a] transition-colors">{news.title}</h2>
                        </Link>
                    ))}
                </div>
                <div className="col-span-12 lg:col-span-4 space-y-4">
                    {effectiveRightItems.map(news => (
                        <NewsCard key={news.id} item={news} variant="compact" showDescription={true} />
                    ))}
                </div>
            </section>

            {/* Banner 7GAMES (Component Restored) */}
            <GamesBanner />

            {/* Sub-nav (Exact Match) */}
            <div className="flex gap-6 border-b border-gray-100 mb-8 pb-2 text-[10px] font-black uppercase tracking-widest">
                <span className="text-black border-b-2 border-black pb-2 cursor-pointer">Coluna Mariano Wikoli</span>
                <span className="text-gray-400 cursor-pointer hover:text-black">Política</span>
                <span className="text-gray-400 cursor-pointer hover:text-black">Geral</span>
            </div>

            {/* Seção Mariano (1 Main + 4 List) */}
            <section className="grid grid-cols-12 gap-8 mb-16">
                <div className="col-span-12 lg:col-span-8">
                    {marianoMain && (
                        <Link to={`/noticia/${marianoMain.id}`} className="group block">
                            <div className="overflow-hidden rounded mb-4">
                                <img src={marianoMain.image} className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                            </div>
                            <h3 className="text-2xl font-bold font-serif group-hover:text-[#16a34a] transition-colors">{marianoMain.title}</h3>
                        </Link>
                    )}
                </div>
                <div className="col-span-12 lg:col-span-4 divide-y divide-gray-100">
                    {marianoList.map(news => (
                        <NewsListItem key={news.id} item={news} />
                    ))}
                </div>
            </section>

            {/* Banner Casa Legal (Component Restored) */}
            <AdBanner />

            {/* Seção Especial Sílvio Mendes (Restored) */}
            <section className="bg-[#1c3c3c] rounded p-12 text-white flex items-center gap-8 my-16">
                <div className="flex-1">
                    <h2 className="text-4xl font-black font-serif leading-loose">
                        <span className="bg-[#16a34a] px-2 py-1 leading-relaxed inline-block mb-1">Ao Hora Piauí, Sílvio Mendes</span><br />
                        <span className="bg-[#16a34a] px-2 py-1 leading-relaxed inline-block mb-1">fala sobre</span><br />
                        <span className="bg-[#16a34a] px-2 py-1 leading-relaxed inline-block mb-1">contas, Jeová, eleição da</span><br />
                        <span className="bg-[#16a34a] px-2 py-1 leading-relaxed inline-block mb-1">Câmara e</span><br />
                        <span className="bg-[#16a34a] px-2 py-1 leading-relaxed inline-block mb-1">secretariado</span>
                    </h2>
                </div>
                <div className="hidden md:block flex-1">
                    <img src="https://framerusercontent.com/images/3mS7M6T7C5Vp5K8R6s7E7.png" alt="" className="w-full max-w-sm ml-auto" />
                </div>
            </section>

            {/* Vídeos (5 items grid) */}
            <section className="my-12">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-6">Assista aos vídeos de hoje</p>
                <div className="grid grid-cols-5 gap-4">
                    {latestVideos.map(video => (
                        <VideoCard key={video.id} item={video} />
                    ))}
                </div>
            </section>
        </main>
    );
};

export default HomePage;
