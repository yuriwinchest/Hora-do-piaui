import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AdvertisingBanner } from '../types';
import GamesBanner from './GamesBanner';

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
        return <div className="w-full h-32 bg-gray-100 rounded-lg animate-pulse mb-12"></div>;
    }

    if (banners.length === 0) {
        return null;
    }

    const currentBanner = banners[currentIndex];

    const Content = () => (
        <div className="w-full relative rounded-lg overflow-hidden shadow-lg group">
            <img
                src={currentBanner.image_url}
                alt="Publicidade"
                className="w-full h-auto min-h-[100px] md:h-40 object-cover md:object-cover transition-transform duration-700 group-hover:scale-105"
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
