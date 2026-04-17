import React from 'react';
import { BannerConfig } from '../types';

interface DynamicVideoBannerProps {
    config: BannerConfig;
}

const getEmbedUrl = (url: string) => {
    if (!url) return null;

    // YouTube Parser
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (ytMatch && ytMatch[1]) {
        return {
            type: 'youtube',
            src: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`
        };
    }

    // Instagram Parser
    const igMatch = url.match(/instagram\.com\/p\/([a-zA-Z0-9_-]+)/);
    if (igMatch && igMatch[1]) {
        return {
            type: 'instagram',
            src: `https://www.instagram.com/p/${igMatch[1]}/embed`
        };
    }

    return null;
};

const DynamicVideoBanner: React.FC<DynamicVideoBannerProps> = ({ config }) => {
    if (!config || !config.is_active) return null;

    const embed = getEmbedUrl(config.video_url);
    const isRightAligned = config.alignment === 'right';

    // Parse title to create highlighted spans for each line
    const renderTitle = () => {
        return config.title.split('\n').map((line, index) => (
            <React.Fragment key={index}>
                <span className="bg-[#16a34a] px-2 py-1 leading-relaxed inline-block mb-1 box-decoration-clone">
                    {line.trim()}
                </span>
                <br />
            </React.Fragment>
        ));
    };

    return (
        <section className="bg-[#1c3c3c] rounded p-6 md:p-12 text-white my-16 overflow-hidden">
            <div className={`flex flex-col md:flex-row items-center gap-8 ${isRightAligned ? 'md:flex-row-reverse' : ''}`}>
                
                {/* Text Content */}
                <div className="flex-1 w-full text-left">
                    <h2 className="text-3xl md:text-4xl font-black font-serif leading-loose">
                        {renderTitle()}
                    </h2>
                </div>

                {/* Video Content */}
                {embed && (
                    <div className="flex-1 w-full flex justify-center md:justify-end">
                        <div className={`w-full max-w-lg overflow-hidden rounded-xl shadow-2xl bg-black ${embed.type === 'instagram' ? 'aspect-[4/5] max-w-sm' : 'aspect-video'}`}>
                            <iframe
                                src={embed.src}
                                className="w-full h-full"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title="Video Banner"
                            />
                        </div>
                    </div>
                )}
                
                {/* Placeholder Image Fallback if URL is invalid but active */}
                {!embed && config.video_url && (
                   <div className="flex-1 w-full flex justify-center items-center h-64 bg-black/20 rounded-xl">
                       <p className="text-white/50 font-bold">Vídeo indisponível ou link inválido</p>
                   </div>
                )}
            </div>
        </section>
    );
};

export default DynamicVideoBanner;
