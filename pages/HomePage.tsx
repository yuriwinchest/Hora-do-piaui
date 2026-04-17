import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NewsItem, HomeLayoutConfig, BannerConfig } from '../types';
import NewsCard from '../components/NewsCard';
import VideoCard from '../components/VideoCard';
import DynamicVideoBanner from '../components/DynamicVideoBanner';
import AdCarousel from '../components/AdCarousel';
import TabbedNewsSection from '../components/TabbedNewsSection';
import AdBanner from '../components/AdBanner';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/common/SEO';

interface HomePageProps {
    items: NewsItem[];
    config: HomeLayoutConfig;
    // Remove old bannerConfig prop if we are fetching internally or pass array
}

const HomePage: React.FC<HomePageProps> = ({ items, config }) => {
    const [latestVideos, setLatestVideos] = useState<any[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
    const [mainBannerConfig, setMainBannerConfig] = useState<BannerConfig | null>(null);
    const [secondaryBannerConfig, setSecondaryBannerConfig] = useState<BannerConfig | null>(null);
    // Ref para a seção de vídeos
    const videoSectionRef = React.useRef<HTMLDivElement>(null);
    const videoCarouselRef = React.useRef<HTMLDivElement>(null);

    const scrollCarousel = (direction: 'left' | 'right') => {
        if (videoCarouselRef.current) {
            const scrollAmount = 260; // Largura do card + gap
            videoCarouselRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                // Videos: mapear snake_case (banco) -> camelCase (componente).
                // Sem o map, video.tag_color/video.image podem nao popular tagColor/image
                // do VideoCard, deixando o card sem capa e sem cor de tag.
                const { data: videos, error: videosError } = await supabase
                    .from('horapiaui_videos')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (videosError) {
                    console.warn('Erro ao carregar vídeos:', videosError.message);
                } else if (videos) {
                    const mapped = videos.map((v: any) => ({
                        id: v.id,
                        title: v.title,
                        image: v.image || v.thumbnail,
                        thumbnail: v.thumbnail || v.image,
                        url: v.url,
                        duration: v.duration,
                        tag: v.tag,
                        tagColor: v.tag_color,
                    }));
                    setLatestVideos(mapped);
                    setSelectedVideo(mapped[0]);
                }

                // Banners - .limit(1) evita 406 em tabela vazia
                const { data: banners, error: bannersError } = await supabase
                    .from('horapiaui_banners')
                    .select('*')
                    .eq('is_active', true)
                    .limit(10);
                
                if (bannersError) {
                    console.warn('Erro ao carregar banners:', bannersError.message);
                } else if (banners && banners.length > 0) {
                    const main = banners.find((b: any) => b.position === 'home_main' || !b.position);
                    const secondary = banners.find((b: any) => b.position === 'home_secondary');
                    setMainBannerConfig(main || null);
                    setSecondaryBannerConfig(secondary || null);
                }
            } catch (err) {
                console.error('Erro inesperado ao carregar dados:', err);
            }
        };
        fetchVideos();
    }, []);

    // Encontrar notícia urgente
    const urgentNews = items.find(item => item.isUrgent);

    // Helper to fill items if selection is incomplete
    const fillItems = (currentItems: NewsItem[], count: number, excludeIds: string[]) => {
        if (currentItems.length >= count) return currentItems.slice(0, count);

        const needed = count - currentItems.length;
        // Filter candidates: not already selected, not excluded, and NOT the urgent news (to avoid duplication)
        const candidates = items.filter(item =>
            !currentItems.some(c => c.id === item.id) &&
            !excludeIds.includes(item.id) &&
            (!urgentNews || item.id !== urgentNews.id)
        );

        return [...currentItems, ...candidates.slice(0, needed)];
    };

    // 1. Calculate Left Items (Grid) - Needs 2 items
    // First, try manual config
    const manualLeftItems = config.heroTopIds
        .map(id => items.find(item => item.id === id))
        .filter((item): item is NewsItem => !!item);

    // Fill if needed
    const effectiveLeftItems = fillItems(manualLeftItems, 2, []);

    // 2. Calculate Right Items (Sidebar) - Needs 2 items
    // First, try manual config
    const manualRightItems = config.heroSideIds
        .map(id => items.find(item => item.id === id))
        .filter((item): item is NewsItem => !!item);

    // Fill if needed, excluding items already used in Left Grid
    const effectiveRightItems = fillItems(manualRightItems, 2, effectiveLeftItems.map(i => i.id));

    // Determinar imagem de destaque para SEO
    // Prioridade: Urgent News -> Primeiro item do grid -> Logo (fallback interno do SEO)
    const featuredImage = urgentNews?.image || effectiveLeftItems[0]?.image;
    const featuredTitle = urgentNews?.title || 'Hora do Piauí - Notícias';
    const featuredDescription = urgentNews?.description || 'O seu portal de notícias do Piauí e do Brasil.';

    return (
        <main className="max-w-7xl mx-auto px-4 py-8">
            <SEO
                title={featuredTitle}
                description={featuredDescription}
                image={featuredImage}
                type="website"
            />
            {/* Urgent News Banner */}
            {urgentNews && (
                <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                    <Link to={`/noticia/${urgentNews.slug || urgentNews.id}`} className={`group block w-full rounded-2xl shadow-lg overflow-hidden ${urgentNews.image ? 'md:relative md:aspect-[2.5/1]' : ''}`}>
                        {urgentNews.image ? (
                            <>
                                <img
                                    src={urgentNews.image}
                                    alt={urgentNews.title}
                                    className="w-full aspect-video object-cover object-[center_25%] md:absolute md:inset-0 md:h-full md:aspect-auto group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="relative bg-white p-6 md:bg-transparent md:absolute md:inset-0 md:bg-gradient-to-t md:from-black/90 md:via-black/40 md:to-transparent md:flex md:flex-col justify-end p-6 md:p-10 lg:p-12">
                                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-black md:text-white font-serif leading-tight group-hover:underline decoration-[#16a34a] underline-offset-8 drop-shadow-none md:drop-shadow-lg">
                                        {urgentNews.title}
                                    </h2>
                                    {urgentNews.description && (
                                        <p className="text-gray-600 md:text-gray-200 mt-4 text-lg md:text-xl line-clamp-2 max-w-4xl drop-shadow-none md:drop-shadow-md font-medium">
                                            {urgentNews.description}
                                        </p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="w-full bg-white flex flex-col justify-start items-start p-4 md:p-6 h-auto">
                                {(urgentNews.section || urgentNews.category || 'Manchete').toLowerCase() !== 'geral' && (
                                    <span className="text-[#16a34a] px-0 py-0.5 text-xs font-black uppercase tracking-wider w-fit mb-2">
                                        {urgentNews.section || urgentNews.category || 'Manchete'}
                                    </span>
                                )}
                                <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white font-serif leading-tight text-left mb-2">
                                    <span className="bg-[#16a34a] px-2 box-decoration-clone leading-normal py-1 rounded-sm">
                                        {urgentNews.title}
                                    </span>
                                </h2>
                                {urgentNews.description && (
                                    <p className="text-gray-600 text-base md:text-lg line-clamp-3 max-w-4xl font-medium text-left mt-2">
                                        {urgentNews.description}
                                    </p>
                                )}
                            </div>
                        )}
                    </Link>
                </div>
            )}

            {/* Banner Dinâmico (Removido daqui) */}

            {/* Grid Destaque: 2 Colunas (2 Main + Sidebar) */}
            <section className="grid grid-cols-12 gap-6 mb-12">
                <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {effectiveLeftItems.map(news => (
                        <Link to={`/noticia/${news.slug || news.id}`} key={news.id} className="group block h-full">
                            {news.image ? (
                                <>
                                    <div className="overflow-hidden rounded mb-2">
                                        <img src={news.image} className="w-full aspect-video object-cover object-[center_25%] group-hover:scale-105 transition-transform duration-500" alt="" referrerPolicy="no-referrer" loading="lazy" />
                                    </div>
                                    <h2 className="text-lg text-black font-black font-serif leading-tight group-hover:text-[#16a34a] transition-colors">{news.title}</h2>
                                </>
                            ) : (
                                <div className="overflow-hidden rounded bg-gray-50 border border-gray-100 flex flex-col justify-center items-start p-4 h-auto">
                                    <h2 className="text-lg md:text-xl text-black font-bold font-serif leading-tight text-left">
                                        <span className="bg-[#16a34a] text-white px-1 box-decoration-clone leading-normal">
                                            {news.title}
                                        </span>
                                    </h2>
                                </div>
                            )}
                        </Link>
                    ))}
                </div>
                <div className="col-span-12 lg:col-span-4 space-y-4">
                    {effectiveRightItems.map(news => (
                        <NewsCard key={news.id} item={news} variant="compact" showDescription={true} />
                    ))}
                </div>
            </section>

            {/* Banner Publicidade Rotativo */}
            <AdCarousel />

            {/* Seção Tabbed (Mariano / Política / Geral) */}
            <TabbedNewsSection
                items={items}
                marianoConfig={{
                    mainId: config.marianoMainId,
                    listIds: config.marianoListIds
                }}
            />

            {/* Banner Casa Legal (Substituído por Banner Dinâmico Secundário) */}
            {secondaryBannerConfig?.is_active ? (
                <div className="mb-12">
                    <DynamicVideoBanner config={secondaryBannerConfig} />
                </div>
            ) : (
                <AdBanner />
            )}

            {/* Banner Dinâmico (Substituindo Seção Sílvio Mendes - Banner Principal) */}
            {mainBannerConfig?.is_active ? (
                <DynamicVideoBanner config={mainBannerConfig} />
            ) : (
                /* Fallback para banner estático se o dinâmico não estiver ativo */
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
                        {/* The old framerusercontent URL is 404; keep this banner self-hosted */}
                        <img
                            src="/assets/image.png"
                            alt="Hora do Piauí"
                            className="w-full max-w-sm ml-auto"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                        />
                    </div>
                </section>
            )}

            {/* Vídeos (5 items grid) */}
            <section className="my-12" ref={videoSectionRef}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-6">Assista aos vídeos de hoje</p>

                {/* Mobile Layout */}
                <div className="md:hidden flex flex-col gap-6">
                    {/* Destaque Mobile */}
                    {selectedVideo && (
                        <div className="w-full">
                            <VideoCard key={selectedVideo.id} item={selectedVideo} />
                        </div>
                    )}
                    {/* Carrossel Mobile com Botões Flutuantes */}
                    <div className="relative group">
                        {/* Botão Esquerdo */}
                        <button
                            onClick={() => scrollCarousel('left')}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                            aria-label="Anterior"
                        >
                            <ChevronLeft size={24} />
                        </button>

                        <div
                            ref={videoCarouselRef}
                            className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar snap-x snap-mandatory touch-pan-x scroll-smooth"
                        >
                            {latestVideos.map(video => (
                                <div
                                    key={video.id}
                                    className={`flex-shrink-0 snap-center min-w-[240px] w-[240px] cursor-pointer transition-opacity ${selectedVideo?.id === video.id ? 'opacity-100 ring-2 ring-[#16a34a] rounded-lg' : 'opacity-70'}`}
                                    onClick={() => {
                                        setSelectedVideo(video);
                                    }}
                                >
                                    <div className="pointer-events-none">
                                        <VideoCard item={video} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Botão Direito */}
                        <button
                            onClick={() => scrollCarousel('right')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Próximo"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:grid grid-cols-5 gap-4">
                    {latestVideos.map(video => (
                        <VideoCard key={video.id} item={video} />
                    ))}
                </div>
            </section>
        </main>
    );
};

export default HomePage;
