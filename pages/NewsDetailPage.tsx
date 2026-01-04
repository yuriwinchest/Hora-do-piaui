import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Share2, Facebook, Search } from 'lucide-react';
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
            <div className="max-w-4xl mx-auto px-4 pt-8 md:pt-16">

                {/* Author Section */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 bg-gray-50">
                        <img
                            src={MOCK_AUTHOR.image}
                            alt={MOCK_AUTHOR.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=HP&background=random';
                            }}
                        />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 text-sm md:text-base leading-none mb-1">
                            Por {MOCK_AUTHOR.name}
                        </p>
                        <p className="text-xs md:text-sm text-gray-500 font-medium">
                            {MOCK_AUTHOR.role}
                        </p>
                    </div>
                </div>

                {/* Header: Title, Description, Date */}
                <header className="mb-8 md:mb-12">
                    <h1 className="text-3xl md:text-5xl lg:text-[3.5rem] font-black text-gray-900 font-serif leading-[1.1] mb-6 tracking-tight">
                        {news.title}
                    </h1>

                    {news.description && (
                        <p className="text-lg md:text-2xl text-gray-500 font-medium font-serif leading-relaxed mb-6">
                            {news.description}
                        </p>
                    )}

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-t border-b border-gray-100 py-6">
                        <div className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest">
                            {news.date} às {news.time}
                            {/* Mock updated time if needed */}
                            {/* <span className="hidden md:inline"> - Atualizado há 1 hora</span> */}
                        </div>

                        {/* Social Share */}
                        <div className="flex items-center gap-3">
                            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1877F2] text-white hover:opacity-90 transition-opacity" title="Compartilhar no Facebook">
                                <Facebook size={18} fill="currentColor" />
                            </button>
                            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-[#25D366] text-white hover:opacity-90 transition-opacity" title="Compartilhar no WhatsApp">
                                {/* WhatsApp Icon mockup using generic Phone/Message icon if Lucide doesn't have it, usually MessageCircle or Phone is used, but hardcoded SVG is better for brand. Using text for now or Lucide generic. */}
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                            </button>
                            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors" title="Outras opções">
                                <Share2 size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Image */}
                <div className="bg-gray-100 rounded-lg overflow-hidden mb-12 shadow-sm w-full">
                    <img
                        src={news.image}
                        alt={news.title}
                        className="w-full h-auto object-cover max-h-[600px]"
                    />
                    {/* Image Caption - Mocked or could be Description if suitable */}
                    <div className="bg-gray-50 px-4 py-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Foto: Divulgação / Redação</p>
                    </div>
                </div>

                {/* Article Content */}
                <div className="prose prose-lg md:prose-xl prose-gray max-w-none font-serif text-gray-800 leading-loose mb-20">
                    {news.content?.startsWith('<') ? (
                        <div dangerouslySetInnerHTML={{ __html: news.content }} />
                    ) : (
                        news.content?.split('\n').map((paragraph, idx) => (
                            <p key={idx} className="mb-8">
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
