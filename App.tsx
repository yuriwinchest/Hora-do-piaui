import React from 'react';
import { ChevronLeft, ChevronRight, Reply } from 'lucide-react';
import { Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import NewsCard from './components/NewsCard';
import NewsListItem from './components/NewsListItem';
import VideoCard from './components/VideoCard';
import GamesBanner from './components/GamesBanner';
import AdBanner from './components/AdBanner';
import type { NewsItem } from './types';
import {
  TOP_NEWS,
  SIDE_NEWS,
  SUB_NAV,
  MIDDLE_FEATURE,
  MIDDLE_LIST,
  DARK_FEATURE_IMAGE,
  VIDEOS
} from './constants';

const normalizeText = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');



const PageContainer: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  return (
    <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
      <h1 className="text-3xl md:text-4xl font-bold font-serif leading-tight mb-6">
        {title}
      </h1>
      {children}
    </main>
  );
};

const NewsFeedPage: React.FC<{ title: string; kind: 'politica' | 'geral' | 'coluna-mariano'; items: NewsItem[] }> = ({ title, kind, items: allItems }) => {
  const items = React.useMemo(() => {
    if (kind === 'coluna-mariano') return allItems.filter((n) => n.category === 'coluna-mariano');
    return allItems.filter((n) => normalizeText(n.section ?? '') === kind);
  }, [kind, allItems]);

  return (
    <PageContainer title={title}>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 font-sans">Nenhuma notícia encontrada.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="h-full">
              <NewsCard item={item} />
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
};

const VideosPage: React.FC = () => {
  return (
    <PageContainer title="Vídeos">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {VIDEOS.map((video) => (
          <VideoCard key={video.id} item={video} />
        ))}
      </div>
    </PageContainer>
  );
};

const NewsDetailPage: React.FC<{ items: NewsItem[] }> = ({ items: allItems }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const item = React.useMemo(() => allItems.find((n) => n.id === id), [id, allItems]);

  if (!item) {
    return (
      <PageContainer title="Notícia">
        <p className="text-sm text-gray-500 font-sans mb-6">Notícia não encontrada.</p>
        <Link to="/" className="text-primary hover:underline font-sans">Voltar para a home</Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={item.title}>
      <div className="mb-4">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-primary font-sans"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft size={18} />
          Voltar
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-gray-100 shadow-md mb-6">
        <img src={item.image} alt={item.title} className="w-full h-auto object-cover" />
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-gray-500 font-sans mb-4">
        {item.section && (
          <span className="uppercase tracking-wide">{item.section}</span>
        )}
        {item.category && (
          <span className="uppercase tracking-wide">{item.category}</span>
        )}
        {item.date && <span>{item.date}</span>}
        {item.time && <span>{item.time}</span>}
      </div>

      {item.content ? (
        <div
          className="prose prose-lg max-w-none text-gray-800 font-sans leading-relaxed news-content"
          dangerouslySetInnerHTML={{ __html: item.content }}
        />
      ) : item.description ? (
        <p className="text-lg text-gray-800 font-sans leading-relaxed">
          {item.description}
        </p>
      ) : null}
    </PageContainer>
  );
};

const HomePage: React.FC<{ items: NewsItem[] }> = ({ items: allItems }) => {
  const videoCarouselRef = React.useRef<HTMLDivElement | null>(null);

  const scrollVideoCarousel = React.useCallback((direction: 'left' | 'right') => {
    const el = videoCarouselRef.current;
    if (!el) return;
    const step = 192;
    el.scrollBy({ left: direction === 'left' ? -step : step, behavior: 'smooth' });
  }, []);

  const topNews = React.useMemo(() => allItems.filter(n => ['1', '2'].includes(n.id)), [allItems]);
  const sideNews = React.useMemo(() => allItems.filter(n => ['3', '4'].includes(n.id)), [allItems]);
  const middleFeature = React.useMemo(() => allItems.find(n => n.id === '5') || allItems[0], [allItems]);
  const homeMiddleList = React.useMemo(() => allItems.filter(n => n.category === 'coluna-mariano'), [allItems]);

  return (
    <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
      <h1 className="text-4xl md:text-5xl font-medium mb-8 font-serif leading-tight">
        <span className="bg-[#00C24A] text-white px-2 box-decoration-clone leading-[1.3] inline-block">
          Trump anuncia ataque à Venezuela
        </span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 border-b border-gray-200 pb-12">
        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            {topNews.map((item) => (
              <Link key={item.id} to={`/noticia/${item.id}`} className="group block h-full">
                <div className="h-full relative flex flex-col">
                  <div className="overflow-hidden rounded-lg mb-3 bg-gray-100 shadow-md aspect-[4/3]">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h2 className="text-xl text-black font-bold font-serif leading-snug group-hover:text-primary transition-colors">
                    {item.title}
                  </h2>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 pl-0 lg:pl-8 lg:border-l border-gray-200 flex flex-col justify-between">
          <div className="divide-y divide-gray-100 h-full flex flex-col justify-between">
            {sideNews.map((item) => (
              <div key={item.id} className="py-2 first:pt-0 last:pb-0 h-full">
                <NewsCard item={item} variant="compact" showDescription={true} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <GamesBanner />

      <div className="flex items-center justify-between border-b-2 border-gray-100 mb-6">
        <div className="flex gap-8 overflow-x-auto">
          {SUB_NAV.map((item) => (
            <NavLink
              key={item.label}
              to={item.href}
              className={({ isActive }) =>
                `pb-2 border-b-2 font-black uppercase text-base tracking-wide whitespace-nowrap transition-all ${isActive || item.label === 'Coluna Mariano Wikoli'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-600 hover:text-black hover:border-gray-300'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <button type="button" aria-label="Compartilhar" className="flex-shrink-0 text-gray-400 hover:text-primary transform -scale-x-100">
          <Reply size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 mb-12 items-start">
        {/* 1. Main Photo */}
        <div className="lg:col-span-5 order-1 w-full">
          <Link to={`/noticia/${middleFeature.id}`} className="group block">
            <div className="overflow-hidden rounded-lg bg-gray-100 shadow-md aspect-[7/8] relative">
              <img
                src={middleFeature.image}
                alt={middleFeature.title}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 filter brightness-105 contrast-105 absolute inset-0"
              />
            </div>
          </Link>
        </div>

        {/* 2. Main Title (Mobile only here, Desktop below) */}
        <div className="lg:hidden order-2 mt-4 mb-6">
          <Link to={`/noticia/${middleFeature.id}`} className="group block">
            <h2 className="text-2xl text-black font-bold font-serif leading-snug group-hover:text-primary transition-colors">
              {middleFeature.title}
            </h2>
          </Link>
        </div>

        {/* 3. Side List - Aligns with photo height on desktop */}
        <div className="lg:col-span-7 order-3 lg:order-2 self-stretch flex flex-col justify-between py-0">
          {homeMiddleList.slice(0, 4).map((item) => (
            <NewsListItem key={item.id} item={item} />
          ))}
        </div>

        {/* 4. Main Title (Desktop only here) */}
        <div className="hidden lg:block lg:col-span-5 order-4 mt-3">
          <Link to={`/noticia/${middleFeature.id}`} className="group block">
            <h2 className="text-xl text-black font-bold font-serif leading-snug group-hover:text-primary transition-colors">
              {middleFeature.title}
            </h2>
          </Link>
        </div>
      </div>

      <AdBanner />

      <div className="w-full bg-black rounded-xl overflow-hidden mb-12 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="p-8 lg:p-12 flex flex-col justify-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight font-sans">
              <span className="bg-[#22c55e] px-1 box-decoration-clone text-white">Ao Hora Piauí, Sílvio Mendes fala sobre</span>
              <span className="bg-[#22c55e] px-1 box-decoration-clone text-white mt-2 inline-block">contas, Jeová, eleição da Câmara e</span>
              <span className="bg-[#22c55e] px-1 box-decoration-clone text-white mt-2 inline-block">secretariado</span>
            </h2>
          </div>
          <div className="h-64 lg:h-auto relative">
            <img
              src={DARK_FEATURE_IMAGE}
              alt="Entrevista com dois homens"
              className="absolute inset-0 w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/50 lg:bg-gradient-to-r lg:from-black lg:to-transparent"></div>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">
          Assista aos vídeos de hoje
        </h3>
        <div className="md:hidden relative -mx-4">
          <button
            type="button"
            aria-label="Vídeos anteriores"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 border border-gray-200 shadow-sm rounded-full p-2"
            onClick={() => scrollVideoCarousel('left')}
          >
            <ChevronLeft size={18} className="text-gray-800" />
          </button>
          <button
            type="button"
            aria-label="Próximos vídeos"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 border border-gray-200 shadow-sm rounded-full p-2"
            onClick={() => scrollVideoCarousel('right')}
          >
            <ChevronRight size={18} className="text-gray-800" />
          </button>

          <div
            ref={videoCarouselRef}
            className="px-4 overflow-x-scroll flex flex-nowrap gap-4 snap-x snap-mandatory pb-2 touch-pan-x"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {VIDEOS.map((video) => (
              <div key={video.id} className="w-44 flex-shrink-0 snap-start">
                <VideoCard item={video} />
              </div>
            ))}
          </div>
        </div>
        <div className="hidden md:grid grid-cols-3 lg:grid-cols-5 gap-4">
          {VIDEOS.map((video) => (
            <VideoCard key={video.id} item={video} />
          ))}
        </div>
      </div>
    </main>
  );
};

import AdminLayout from './components/admin/AdminLayout';
import AdminNewsList from './components/admin/AdminNewsList';
import NewsForm from './components/admin/NewsForm';
import { Plus, LayoutGrid, FileText, CheckCircle2 } from 'lucide-react';

const AdminDashboard: React.FC<{ items: NewsItem[] }> = ({ items }) => {
  const publishedCount = items.filter(i => i.status === 'published').length;
  const draftCount = items.filter(i => i.status === 'draft').length;

  const stats = [
    { label: 'Publicadas', value: publishedCount, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Rascunhos', value: draftCount, icon: FileText, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Geral', value: items.filter(i => i.category === 'geral').length, icon: LayoutGrid, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Política', value: items.filter(i => i.category === 'politica').length, icon: FileText, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Painel de Controle</h1>
        <p className="text-gray-500 font-bold">Bem-vindo de volta ao editor do Hora Piauí.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Novo Conteúdo</h3>
            <p className="text-gray-500 font-bold mb-6 text-sm">Crie uma nova notícia em qualquer categoria.</p>
          </div>
          <Link
            to="/admin/noticia/nova"
            className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-black text-white font-black hover:bg-gray-800 transition-all shadow-xl shadow-black/10 w-full"
          >
            <Plus size={20} />
            Nova Notícia
          </Link>
        </div>

        <div className="bg-primary/5 p-8 rounded-2xl border border-primary/10 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-black text-primary mb-2">Tutorial Rápido</h3>
            <p className="text-primary/70 font-bold mb-6 text-sm leading-relaxed">
              Você pode salvar rascunhos sem que eles apareçam no site. Quando estiver tudo pronto, clique em "Publicar" para que a notícia fique visível para os leitores.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [allNews, setAllNews] = React.useState<NewsItem[]>(() => {
    // Initialize status for existing news
    const items = [...TOP_NEWS, ...SIDE_NEWS, MIDDLE_FEATURE, ...MIDDLE_LIST];
    const map = new Map<string, NewsItem>();
    for (const item of items) {
      if (!map.has(item.id)) {
        map.set(item.id, { ...item, status: 'published' });
      }
    }
    return Array.from(map.values());
  });

  const handleSaveNews = (item: NewsItem) => {
    setAllNews(prev => {
      const index = prev.findIndex(n => n.id === item.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = item;
        return updated;
      }
      return [item, ...prev];
    });
  };

  const handleDeleteNews = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta notícia?')) {
      setAllNews(prev => prev.filter(n => n.id !== id));
    }
  };

  const handlePublishNews = (id: string) => {
    setAllNews(prev => prev.map(n => n.id === id ? { ...n, status: 'published' } : n));
  };

  const NewsEditorWrapper: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const item = allNews.find(n => n.id === id);
    return <NewsForm onSave={handleSaveNews} existingItem={item} />;
  };

  // Filter published news for the public pages
  const publishedNews = React.useMemo(() => allNews.filter(n => n.status === 'published'), [allNews]);

  return (
    <div className="min-h-screen flex flex-col font-sans font-bold text-gray-900">
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin/*" element={
          <AdminLayout>
            <Routes>
              <Route path="/" element={<AdminDashboard items={allNews} />} />
              <Route path="/noticias" element={
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-black text-gray-900">Notícias</h1>
                      <p className="text-gray-500 font-bold">Gerencie todas as publicações.</p>
                    </div>
                    <Link
                      to="/admin/noticia/nova"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                      <Plus size={18} />
                      Nova Notícia
                    </Link>
                  </div>
                  <AdminNewsList
                    items={allNews}
                    onEdit={(item) => window.location.href = `/admin/noticia/editar/${item.id}`}
                    onDelete={handleDeleteNews}
                    onPublish={handlePublishNews}
                  />
                </div>
              } />
              <Route path="/noticia/nova" element={<NewsForm onSave={handleSaveNews} />} />
              <Route path="/noticia/editar/:id" element={<NewsEditorWrapper />} />
              <Route path="/configuracoes" element={
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                  <h1 className="text-2xl font-black text-gray-900 mb-6">Configurações Gerais</h1>
                  <p className="text-gray-500 font-bold">Em breve: gerenciamento de banners, tags e SEO.</p>
                </div>
              } />
            </Routes>
          </AdminLayout>
        } />

        {/* Public Routes */}
        <Route path="*" element={
          <>
            <Header />
            <Routes>
              <Route path="/" element={<HomePage items={publishedNews} />} />
              <Route path="/politica" element={<NewsFeedPage title="Política" kind="politica" items={publishedNews} />} />
              <Route path="/geral" element={<NewsFeedPage title="Geral" kind="geral" items={publishedNews} />} />
              <Route path="/coluna-mariano" element={<NewsFeedPage title="Coluna Mariano Wikoli" kind="coluna-mariano" items={publishedNews} />} />
              <Route path="/videos" element={<VideosPage />} />
              <Route path="/noticia/:id" element={<NewsDetailPage items={publishedNews} />} />
            </Routes>
            <Footer />
          </>
        } />
      </Routes>
    </div>
  );
};

export default App;
