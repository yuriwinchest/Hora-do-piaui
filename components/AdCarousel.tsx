import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AdvertisingBanner } from '../types';
import GamesBanner from './GamesBanner';
import { rewriteLegacySupabaseUrl } from '../utils/supabaseUrl';

type Headline = { id: string; slug?: string | null; title: string };

function MarqueeRow({ items, reverse = false }: { items: Headline[]; reverse?: boolean }) {
    // Duplicate content for seamless looping
    const loop = [...items, ...items];

    return (
        <div className="hp-marquee relative overflow-hidden">
            <div className={`hp-marquee-track ${reverse ? 'hp-marquee-reverse' : ''}`}>
                {loop.map((h, idx) => (
                    <Link
                        key={`${h.id}-${idx}`}
                        to={`/noticia/${h.slug || h.id}`}
                        className="hp-marquee-item"
                        title={h.title}
                    >
                        <span className="hp-marquee-dot" aria-hidden="true" />
                        <span className="hp-marquee-title">{h.title}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}

function NewsTickerAd({ forceLoad }: { forceLoad: boolean }) {
    const [items, setItems] = useState<Headline[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!forceLoad) return;

        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('horapiaui_news')
                    .select('id,slug,title')
                    .order('created_at', { ascending: false })
                    .limit(30);
                if (error) throw error;
                const mapped = (data || [])
                    .map((d: any) => ({ id: d.id, slug: d.slug, title: String(d.title || '').trim() }))
                    .filter((d: Headline) => d.id && d.title);
                if (!cancelled) setItems(mapped);
            } catch (e) {
                console.warn('News ticker: failed to load headlines:', (e as any)?.message || e);
                if (!cancelled) setItems([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [forceLoad]);

    return (
        <div className="w-full relative rounded-lg overflow-hidden shadow-lg mb-12 group">
            <div className="absolute inset-0 hp-ticker-bg" aria-hidden="true" />

            <div className="relative p-4 md:p-5 h-[140px] md:h-40 flex flex-col justify-center gap-3">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="hp-ticker-badge">AO VIVO</span>
                        <span className="hp-ticker-label">Manchetes</span>
                    </div>
                    <div className="hp-ticker-pill">Publicidade</div>
                </div>

                {loading ? (
                    <div className="space-y-2">
                        <div className="h-6 bg-white/10 rounded animate-pulse" />
                        <div className="h-6 bg-white/10 rounded animate-pulse" />
                    </div>
                ) : items.length > 0 ? (
                    <div className="space-y-2">
                        <MarqueeRow items={items} />
                        <MarqueeRow items={items.slice().reverse()} reverse />
                    </div>
                ) : (
                    <div className="text-white/80 font-bold text-sm">
                        Sem manchetes agora.
                    </div>
                )}
            </div>

            <div className="absolute inset-x-0 bottom-0 h-10 hp-ticker-fade" aria-hidden="true" />
        </div>
    );
}

export default function AdCarousel() {
    const [banners, setBanners] = useState<AdvertisingBanner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBanners();
    }, []);

    useEffect(() => {
        if (banners.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 5000); // 5 segundos

        return () => clearInterval(interval);
    }, [banners]);

    const fetchBanners = async () => {
        try {
            const { data } = await supabase
                .from('advertising_banners')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true })
                .order('created_at', { ascending: false });

            setBanners(data || []);
        } catch (error) {
            console.error('Error fetching ads:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="w-full h-[140px] md:h-40 bg-gray-100 rounded-lg animate-pulse mb-12"></div>;
    }

    const currentBanner = banners[currentIndex];
    const imageUrl = currentBanner ? (rewriteLegacySupabaseUrl(currentBanner.image_url) || currentBanner.image_url) : '';
    const isPlaceholder = !!imageUrl && imageUrl.includes('/assets/image.png');

    // If no ads configured (or using placeholder test ad), show a headline ticker instead of a "blank" banner.
    if (banners.length === 0 || isPlaceholder) {
        return <NewsTickerAd forceLoad={true} />;
    }

    const Content = () => (
        <div className="w-full relative rounded-lg overflow-hidden shadow-lg group">
            <img
                src={imageUrl}
                alt="Publicidade"
                className="w-full h-auto min-h-[100px] md:h-40 object-contain md:object-contain bg-black transition-transform duration-700 group-hover:scale-[1.02]"
            />
            <div className="absolute top-2 right-2 bg-black/30 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded border border-white/20 uppercase tracking-wider">
                Publicidade
            </div>

            {/* Indicators if multiple */}
            {banners.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {banners.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );

    if (currentBanner.link_url) {
        return (
            <a href={currentBanner.link_url} target="_blank" rel="noopener noreferrer" className="block mb-12">
                <Content />
            </a>
        );
    }

    return (
        <div className="mb-12">
            <Content />
        </div>
    );
}
