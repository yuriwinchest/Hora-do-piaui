import React, { useRef, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NewsItem, HomeLayoutConfig } from '../types';
import { SUB_NAV, DARK_FEATURE_IMAGE } from '../constants';
import NewsCard from '../components/NewsCard';
import NewsListItem from '../components/NewsListItem';
import VideoCard from '../components/VideoCard';
import GamesBanner from '../components/GamesBanner';
import AdBanner from '../components/AdBanner';
import { supabase } from '../lib/supabase';
import { PageContainer } from '../components/common/PageContainer';

interface HomePageProps {
    items: NewsItem[];
    config: HomeLayoutConfig;
}

const DynamicVideoCarousel = () => {
    const [videos, setVideos] = useState<any[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchVideos = async () => {
            const { data } = await supabase.from('videos').select('*').limit(10);
            if (data) setVideos(data);
        };
        fetchVideos();
    }, []);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = direction === 'left' ? -350 : 350;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (videos.length === 0) return null;

    return (
        <div className="relative group">
            <h3 className="text-xl font-black text-gray-900 mb-6 font-serif">Vídeos em Destaque</h3>
            <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => scroll('left')}
                    className="p-3 rounded-full bg-black/90 text-white shadow-xl hover:scale-110 transition-transform"
                >
                    <ChevronLeft size={24} />
                </button>
            </div>
            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => scroll('right')}
                    className="p-3 rounded-full bg-black/90 text-white shadow-xl hover:scale-110 transition-transform"
                >
                    <ChevronRight size={24} />
                </button>
            </div>

            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {videos.map((video) => (
                    <div key={video.id} className="min-w-[300px] snap-center">
                        <VideoCard video={video} />
                    </div>
                ))}
            </div>
        </div>
    );
};

const VideoList: React.FC<{ limit: number }> = ({ limit }) => {
    const [videos, setVideos] = useState<any[]>([]);

    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase.from('videos').select('*').limit(limit).order('created_at', { ascending: false });
            if (data) setVideos(data);
        };
        fetch();
    }, [limit]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
            ))}
        </div>
    );
};

const HomePage: React.FC<HomePageProps> = ({ items, config }) => {
    const heroMain = items.find(n => n.id === config.heroMainId);
    const heroTop = items.filter(n => config.heroTopIds?.includes(n.id || '')).slice(0, 2);
    const heroSide = items.filter(n => config.heroSideIds?.includes(n.id || '')).slice(0, 2);
    const marianoMain = items.find(n => n.id === config.marianoMainId);
    const marianoList = items.filter(n => config.marianoListIds?.includes(n.id || '')).slice(0, 3);

    // Fallbacks if config fails or IDs mismatch
    const displayHeroMain = heroMain || items[0];
    const displayHeroTop = heroTop.length ? heroTop : items.slice(1, 3);
    const displayHeroSide = heroSide.length ? heroSide : items.slice(3, 5);

    return (
        <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
            <nav className="flex items-center gap-1 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                <span className="w-2 h-2 rounded-full bg-primary/20 mr-2 flex-shrink-0"></span>
                {SUB_NAV.map((item) => (
                    <NavLink
                        key={item.label}
                        to={item.to}
                        className={({ isActive }) => `
              px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap
              ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-gray-500 hover:bg-gray-100'}
            `}
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Hero Section */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-1 lg:gap-8 mb-16">
                <div className="lg:col-span-3 space-y-8 order-2 lg:order-1">
                    {displayHeroTop.map(news => (
                        <NewsCard key={news.id} news={news} variant="compact" />
                    ))}
                </div>

                <div className="lg:col-span-6 order-1 lg:order-2">
                    {displayHeroMain && <NewsCard news={displayHeroMain} variant="featured" />}
                </div>

                <div className="lg:col-span-3 space-y-8 order-3">
                    {displayHeroSide.map(news => (
                        <NewsCard key={news.id} news={news} variant="compact" />
                    ))}
                </div>
            </section>

            <AdBanner position="top" />

            {/* Mariano Section (Politica) */}
            <section className="mb-16">
                <div className="flex items-end justify-between mb-8 border-b-2 border-black pb-4">
                    <h2 className="text-4xl font-black text-gray-900 font-serif tracking-tight">Política</h2>
                    <NavLink to="/politica" className="text-xs font-black uppercase tracking-widest text-primary hover:text-black transition-colors mb-1">
                        Ver tudo
                    </NavLink>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8">
                        {marianoMain && <NewsCard news={marianoMain} variant="horizontal" />}
                    </div>
                    <div className="lg:col-span-4 space-y-0 divide-y divide-gray-100">
                        {marianoList.map(news => (
                            <NewsListItem key={news.id} news={news} />
                        ))}
                    </div>
                </div>
            </section>

            <DynamicVideoCarousel />

            <section className="my-16">
                <GamesBanner />
            </section>

            {/* Dark Feature Section */}
            <section className="relative my-16 rounded-3xl overflow-hidden bg-black text-white">
                <div className="absolute inset-0">
                    <img src={DARK_FEATURE_IMAGE} alt="Background" className="w-full h-full object-cover opacity-40 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                </div>
                <div className="relative z-10 p-8 md:p-16 max-w-2xl">
                    <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-white/10">
                        Reportagem Especial
                    </span>
                    <h2 className="text-3xl md:text-5xl font-black font-serif leading-tight mb-6">
                        O futuro da tecnologia no Piauí: Startups ganham destaque nacional
                    </h2>
                    <p className="text-gray-300 font-bold mb-8 leading-relaxed">
                        Conheça as iniciativas que estão transformando o estado em um polo de inovação.
                    </p>
                    <button className="px-8 py-4 bg-white text-black font-black rounded-xl hover:bg-gray-200 transition-colors uppercase tracking-widest text-xs">
                        Ler Matéria
                    </button>
                </div>
            </section>

            <section className="mb-16">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black text-gray-900 font-serif">Últimos Vídeos</h3>
                    <NavLink to="/videos" className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
                        Ver galeria
                    </NavLink>
                </div>
                <VideoList limit={4} />
            </section>

        </main>
    );
};

export default HomePage;
