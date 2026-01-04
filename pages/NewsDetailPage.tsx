import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Share2, Facebook, Search, Instagram } from 'lucide-react';
import { NewsItem } from '../types';
import { PageContainer } from '../components/common/PageContainer';

interface NewsDetailPageProps {
    items: NewsItem[];
}

// Temporary Mock Author until DB schema is updated
const MOCK_AUTHOR = {
    name: "Redação Hora do Piauí",
    role: "Jornalismo",
    image: "/assets/logo.png" // Fallback to logo
};

const NewsDetailPage: React.FC<NewsDetailPageProps> = ({ items }) => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    // Find news based on title match (slug) or ID
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

    const relatedNews = items
        .filter(n => n.category === news.category && n.id !== news.id)
        .slice(0, 4);

    return (
        <article className="min-h-screen bg-white pb-20 animate-in fade-in duration-700">
            {/* Main Content Container */}
            <div className="max-w-4xl mx-auto px-4 pt-8 md:pt-12">

                {/* Header: Title, Description, Date - Standard News Structure: Title First */}
                <header className="mb-8 md:mb-10">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                            {news.category || 'Notícia'}
                        </span>
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                            {news.date}
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 font-serif leading-[1.1] mb-6 tracking-tight">
                        {news.title}
                    </h1>

                    {news.description && (
                        <p className="text-xl md:text-2xl text-gray-600 font-medium font-sans leading-relaxed mb-8 border-l-4 border-gray-200 pl-6">
                            {news.description}
                        </p>
                    )}

                    {/* Meta & Share */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-t border-gray-100 pt-6">
                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                            <span>Publicado em {news.date} às {news.time}</span>
                        </div>

                        {/* Social Share */}
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2">Compartilhar</span>
                            {news.instagramUrl && (
                                <a
                                    href={news.instagramUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-[#E1306C] text-white hover:opacity-90 transition-all shadow-sm hover:scale-110"
                                    title="Ver no Instagram"
                                >
                                    <Instagram size={18} />
                                </a>
                            )}
                            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1877F2] text-white hover:opacity-90 transition-all shadow-sm hover:scale-110" title="Compartilhar no Facebook">
                                <Facebook size={18} fill="currentColor" />
                            </button>
                            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-[#25D366] text-white hover:opacity-90 transition-all shadow-sm hover:scale-110" title="Compartilhar no WhatsApp">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                            </button>
                            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors" title="Outras opções">
                                <Share2 size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Highlighted Author Section - "Destaque especial" */}
                <div className="mb-12 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-white transform -skew-y-1 rounded-3xl -z-10 shadow-sm border border-gray-100"></div>
                    <div className="bg-white border border-gray-100 shadow-xl shadow-gray-100/50 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                        {/* Decorative accent */}
                        <div className="absolute top-0 left-0 w-2 h-full bg-primary/80"></div>

                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-md flex-shrink-0 relative z-10 bg-gray-100 ring-2 ring-gray-50">
                            <img
                                src={news.authorAvatar || "/assets/logo.png"}
                                alt={news.authorName || "Redação Hora do Piauí"}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=HP&background=random';
                                }}
                            />
                        </div>
                        <div className="flex-1 text-center md:text-left z-10">
                            <p className="font-bold text-gray-400 text-xs uppercase tracking-widest mb-1">Escrito por</p>
                            <h3 className="font-serif font-bold text-gray-900 text-xl md:text-2xl mb-3">
                                {news.authorName || "Redação Hora do Piauí"}
                            </h3>
                            {news.authorBio ? (
                                <p className="text-gray-600 leading-relaxed font-sans text-base md:text-lg">
                                    {news.authorBio}
                                </p>
                            ) : (
                                <p className="text-gray-500 font-medium bg-gray-50 inline-block px-4 py-1.5 rounded-full uppercase tracking-wide text-sm">
                                    {news.authorRole || "Jornalismo"}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Image */}
                <div className="bg-gray-100 rounded-2xl overflow-hidden mb-12 shadow-lg w-full relative group">
                    <img
                        src={news.image}
                        alt={news.title}
                        className="w-full h-auto object-cover max-h-[700px] transition-transform duration-700 group-hover:scale-[1.01]"
                    />
                    {/* Image Caption */}
                    <div className="bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 left-0 right-0 p-6 pt-12">
                        <p className="text-xs md:text-sm text-white/90 uppercase tracking-widest font-medium">
                            Foto: Divulgação / Redação
                        </p>
                    </div>
                </div>

                {/* Article Content */}
                <div className="prose prose-lg md:prose-xl prose-slate max-w-none font-serif text-gray-800 leading-loose mb-20 first-letter:text-5xl first-letter:font-black first-letter:text-primary first-letter:mr-3 first-letter:float-left">
                    {news.content?.startsWith('<') ? (
                        <div dangerouslySetInnerHTML={{ __html: news.content }} />
                    ) : (
                        news.content?.split('\n').map((paragraph, idx) => (
                            <p key={idx} className="mb-8 text-gray-800">
                                {paragraph}
                            </p>
                        ))
                    )}
                </div>
            </div>

            {/* Related News Section (Full Width Background ideally, but constrained here) */}
            <section className="bg-gray-50 border-t border-gray-100 py-16">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex items-center gap-2 mb-8">
                        <span className="w-3 h-8 bg-red-600 rounded-sm"></span>
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                            Leia também sobre {news.category}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {relatedNews.map(item => (
                            <Link key={item.id} to={`/noticia/${item.id}`} className="group flex flex-col gap-3">
                                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-200">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">
                                        {item.category || 'Notícia'}
                                    </span>
                                    <h3 className="font-bold text-gray-900 leading-snug group-hover:text-red-600 transition-colors line-clamp-3">
                                        {item.title}
                                    </h3>
                                </div>
                            </Link>
                        ))}
                        {relatedNews.length === 0 && (
                            <p className="text-gray-500 col-span-full">Nenhuma outra notícia relacionada encontrada.</p>
                        )}
                    </div>
                </div>
            </section>
        </article>
    );
};

export default NewsDetailPage;
