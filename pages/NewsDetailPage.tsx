import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Reply } from 'lucide-react';
import { NewsItem } from '../types';
import { PageContainer } from '../components/common/PageContainer';

interface NewsDetailPageProps {
    items: NewsItem[];
}

const NewsDetailPage: React.FC<NewsDetailPageProps> = ({ items }) => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    // Find news based on title match (slug) or ID
    // Slug implementation is usually normalized title
    // For simplicity, we find by comparing simplified titles if ID not used
    // Or assuming slug is ID?
    // User's App.tsx line 125 logic: `items.find(n => n.title.toLowerCase().includes(slug?.replace(/-/g, ' ') || ''))`

    const news = items.find(n =>
        n.title.toLowerCase().includes(slug?.replace(/-/g, ' ') || '') || n.id === slug
    );

    if (!news) {
        return (
            <PageContainer title="Notícia não encontrada">
                <button onClick={() => navigate('/')} className="text-primary hover:underline font-bold">
                    Voltar para Home
                </button>
            </PageContainer>
        );
    }

    return (
        <article className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <button
                onClick={() => navigate(-1)}
                className="group inline-flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors mb-8 text-gray-500 font-bold"
            >
                <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Voltar
            </button>

            <header className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <span className="px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                        {news.category}
                    </span>
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                        {news.date} • {news.time}
                    </span>
                </div>

                <h1 className="text-3xl md:text-5xl font-black text-gray-900 font-serif leading-tight mb-6">
                    {news.title}
                </h1>

                {news.description && (
                    <p className="text-xl md:text-2xl text-gray-600 font-serif leading-relaxed font-medium">
                        {news.description}
                    </p>
                )}
            </header>

            <div className="bg-gray-100 rounded-3xl overflow-hidden mb-12 shadow-sm aspect-video">
                <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8">
                    <div className="prose prose-lg prose-gray max-w-none font-serif">
                        {/* Check if content is HTML or plain text */}
                        {news.content?.startsWith('<') ? (
                            <div dangerouslySetInnerHTML={{ __html: news.content }} />
                        ) : (
                            news.content?.split('\n').map((paragraph, idx) => (
                                <p key={idx} className="mb-6 leading-relaxed text-gray-800 text-lg">
                                    {paragraph}
                                </p>
                            ))
                        )}
                    </div>

                    {/* Share Section */}
                    <div className="mt-12 pt-8 border-t border-gray-100">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Compartilhar</h3>
                        <div className="flex gap-4">
                            <button className="p-3 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                                <Reply size={20} className="scale-x-[-1]" />
                            </button>
                        </div>
                    </div>
                </div>

                <aside className="lg:col-span-4 space-y-8">
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <h3 className="text-lg font-black text-gray-900 mb-4 font-serif">Leia Também</h3>
                        <div className="space-y-4">
                            {items.filter(n => n.category === news.category && n.id !== news.id).slice(0, 3).map(related => (
                                <Link key={related.id} to={`/noticia/${related.id}`} className="block group">
                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-1">
                                        {related.date}
                                    </span>
                                    <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors leading-snug">
                                        {related.title}
                                    </h4>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <AdBanner position="sidebar" />
                </aside>
            </div>
        </article>
    );
};

export default NewsDetailPage;
