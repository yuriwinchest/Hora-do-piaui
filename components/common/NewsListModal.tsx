import React, { useEffect, useState } from 'react';
import { X, Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { NewsItem } from '../../types';
import { mapNewsFromDb } from '../../utils/mappers';

interface NewsListModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const NewsListModal: React.FC<NewsListModalProps> = ({ isOpen, onClose }) => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && news.length === 0) {
            fetchLatestNews();
        }
    }, [isOpen]);

    // Bloquear scroll do body quando modal estiver aberto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const fetchLatestNews = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('horapiaui_news')
                .select('*')
                .eq('status', 'published')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            if (data) {
                setNews(data.map(mapNewsFromDb));
            }
        } catch (error) {
            console.error('Error fetching news for modal:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full md:w-[600px] h-[85vh] md:h-[80vh] bg-white rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-2xl font-black font-serif text-gray-900">Últimas Notícias</h2>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">
                            Atualizações em tempo real
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Fechar modal"
                    >
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Content List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-200">
                    {loading ? (
                        <div className="flex flex-col gap-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="animate-pulse flex gap-4 p-4 border border-gray-100 rounded-xl">
                                    <div className="w-24 h-24 bg-gray-200 rounded-lg shrink-0" />
                                    <div className="flex-1 space-y-3">
                                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                                        <div className="h-3 bg-gray-200 rounded w-full" />
                                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        news.map(item => (
                            <Link 
                                key={item.id} 
                                to={`/noticia/${item.id}`}
                                onClick={onClose}
                                className="group flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary/20 hover:bg-gray-50 transition-all bg-white shadow-sm"
                            >
                                {item.image && (
                                    <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-200">
                                        <img 
                                            src={item.image} 
                                            alt="" 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                )}
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <span className="text-[10px] font-black text-primary uppercase tracking-wider mb-1 block">
                                            {item.category || 'Geral'}
                                        </span>
                                        <h3 className="font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-2">
                                            {item.title}
                                        </h3>
                                        <p className="text-xs text-gray-500 line-clamp-2 font-medium hidden sm:block">
                                            {item.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase">
                                            <Calendar size={10} />
                                            {item.date} {item.time && `• ${item.time}`}
                                        </div>
                                        <ChevronRight size={14} className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                {/* Footer Gradient Fade */}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            </div>
        </div>
    );
};

export default NewsListModal;
