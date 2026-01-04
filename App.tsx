import React from 'react';
import { ChevronLeft, ChevronRight, Reply, Plus, LayoutGrid, FileText, CheckCircle2, Sliders } from 'lucide-react';
import { Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import NewsCard from './components/NewsCard';
import NewsListItem from './components/NewsListItem';
import VideoCard from './components/VideoCard';
import GamesBanner from './components/GamesBanner';
import AdBanner from './components/AdBanner';
import type { NewsItem, HomeLayoutConfig } from './types';
import {
  TOP_NEWS,
  SIDE_NEWS,
  SUB_NAV,
  MIDDLE_FEATURE,
  MIDDLE_LIST,
  DARK_FEATURE_IMAGE,
  VIDEOS
} from './constants';
import { supabase } from './lib/supabase';
import AdminLayout from './components/admin/AdminLayout';
import AdminNewsList from './components/admin/AdminNewsList';
import NewsForm from './components/admin/NewsForm';
import AdminHomeConfig from './components/admin/AdminHomeConfig';

const mapNewsFromDb = (n: any): NewsItem => ({
  id: n.id,
  title: n.title,
  image: n.image,
  description: n.description,
  content: n.content,
  category: n.category,
  section: n.section,
  date: n.date,
  time: n.time,
  isLarge: n.is_large,
  status: n.status
});

const ErrorState: React.FC<{ message: string }> = ({ message }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center border-t-4 border-black">
    <div className="max-w-md space-y-4">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <Sliders size={32} />
      </div>
      <h2 className="text-2xl font-black text-gray-900">Erro de Conexão</h2>
      <p className="text-gray-500 font-bold leading-relaxed">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-black text-white font-black rounded-xl hover:bg-gray-800 transition-all uppercase tracking-widest text-xs shadow-lg"
      >
        Tentar Novamente
      </button>
      <p className="text-[10px] text-gray-400 mt-8 leading-relaxed font-bold">
        Se o erro persistir, verifique se as tabelas foram criadas corretamente no seu projeto Supabase.
      </p>
    </div>
  </div>
);

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
  const [videos, setVideos] = React.useState<any[]>([]);

  React.useEffect(() => {
    supabase.from('videos').select('*').order('created_at', { ascending: false })
      .then(({ data }) => data && setVideos(data));
  }, []);

  return (
    <PageContainer title="Vídeos">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {videos.map((video) => (
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

const HomePage: React.FC<{ items: NewsItem[]; config: HomeLayoutConfig }> = ({ items: allItems, config }) => {
  const videoCarouselRef = React.useRef<HTMLDivElement | null>(null);

  const scrollVideoCarousel = React.useCallback((direction: 'left' | 'right') => {
    const el = videoCarouselRef.current;
    if (!el) return;
    const step = 192;
    el.scrollBy({ left: direction === 'left' ? -step : step, behavior: 'smooth' });
  }, []);

  const topNews = React.useMemo(() =>
    allItems.filter(n => (config.heroTopIds || []).includes(n.id)),
    [allItems, config.heroTopIds]);

  const sideNews = React.useMemo(() =>
    allItems.filter(n => (config.heroSideIds || []).includes(n.id)),
    [allItems, config.heroSideIds]);

  const middleFeature = React.useMemo(() =>
    allItems.find(n => n.id === config.heroMainId) || allItems[0],
    [allItems, config.heroMainId]);

  if (allItems.length === 0) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-20 text-center">
        <div className="max-w-md">
          <h2 className="text-xl font-black text-gray-900 mb-2">Nenhuma notícia encontrada</h2>
          <p className="text-gray-500 font-bold mb-4">Estamos preparando as notícias para você. Por favor, volte em instantes.</p>
        </div>
      </div>
    );
  }

  const marianoList = React.useMemo(() =>
    allItems.filter(n => (config.marianoListIds || []).includes(n.id)),
    [allItems, config.marianoListIds]);

  return (
    <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
      <h1 className="text-4xl md:text-5xl font-medium mb-8 font-serif leading-tight">
        <span className="bg-[#00C24A] text-white px-2 box-decoration-clone leading-[1.3] inline-block">
          {config.mainHeadline}
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
          {middleFeature && (
            <Link to={`/noticia/${middleFeature.id}`} className="group block">
              <div className="overflow-hidden rounded-lg bg-gray-100 shadow-md aspect-[7/8] relative">
                <img
                  src={middleFeature.image}
                  alt={middleFeature.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 filter brightness-105 contrast-105 absolute inset-0"
                />
              </div>
            </Link>
          )}
        </div>

        {/* 2. Main Title (Mobile only here, Desktop below) */}
        <div className="lg:hidden order-2 mt-4 mb-6">
          {middleFeature && (
            <Link to={`/noticia/${middleFeature.id}`} className="group block">
              <h2 className="text-2xl text-black font-bold font-serif leading-snug group-hover:text-primary transition-colors">
                {middleFeature.title}
              </h2>
            </Link>
          )}
        </div>

        {/* 3. Side List - Aligns with photo height on desktop */}
        <div className="lg:col-span-7 order-3 lg:order-2 self-stretch flex flex-col justify-between py-0">
          {marianoList.slice(0, 4).map((item) => (
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
        <DynamicVideoCarousel scrollVideoCarousel={scrollVideoCarousel} videoCarouselRef={videoCarouselRef} />
        <div className="hidden md:grid grid-cols-3 lg:grid-cols-5 gap-4">
          <VideoList limit={5} />
        </div>
      </div>
    </main>
  );
};

const DynamicVideoCarousel: React.FC<{
  scrollVideoCarousel: (dir: 'left' | 'right') => void,
  videoCarouselRef: React.RefObject<HTMLDivElement>
}> = ({ scrollVideoCarousel, videoCarouselRef }) => {
  const [videos, setVideos] = React.useState<any[]>([]);
  React.useEffect(() => {
    supabase.from('videos').select('*').order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => data && setVideos(data));
  }, []);

  if (videos.length === 0) return null;

  return (
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
        {videos.map((video) => (
          <div key={video.id} className="w-44 flex-shrink-0 snap-start">
            <VideoCard item={video} />
          </div>
        ))}
      </div>
    </div>
  );
};

const VideoList: React.FC<{ limit?: number }> = ({ limit = 5 }) => {
  const [videos, setVideos] = React.useState<any[]>([]);
  React.useEffect(() => {
    supabase.from('videos').select('*').order('created_at', { ascending: false }).limit(limit)
      .then(({ data }) => data && setVideos(data));
  }, [limit]);

  if (videos.length === 0) return null;
  return (
    <>
      {videos.map((video) => (
        <VideoCard key={video.id} item={video} />
      ))}
    </>
  );
};

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Capa do Site</h3>
            <p className="text-gray-500 font-bold mb-6 text-sm">Configure os destaques da página inicial.</p>
          </div>
          <Link
            to="/admin/layout"
            className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 border-black font-black hover:bg-gray-50 transition-all w-full"
          >
            <Sliders size={20} />
            Configurar Home
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
  const [homeConfig, setHomeConfig] = React.useState<HomeLayoutConfig>({
    mainHeadline: 'Bem-vindo ao Hora do Piauí',
    heroMainId: 'f47ac10b-58cc-4372-a567-0e02b2c3d475',
    heroTopIds: ['f47ac10b-58cc-4372-a567-0e02b2c3d471', 'f47ac10b-58cc-4372-a567-0e02b2c3d472'],
    heroSideIds: ['f47ac10b-58cc-4372-a567-0e02b2c3d473', 'f47ac10b-58cc-4372-a567-0e02b2c3d474'],
    marianoMainId: 'f47ac10b-58cc-4372-a567-0e02b2c3d476',
    marianoListIds: ['f47ac10b-58cc-4372-a567-0e02b2c3d477', 'f47ac10b-58cc-4372-a567-0e02b2c3d478', 'f47ac10b-58cc-4372-a567-0e02b2c3d479']
  });

  const [allNews, setAllNews] = React.useState<NewsItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  // Fetch initial data
  React.useEffect(() => {
    async function fetchData() {
      try {
        console.log('Fetching news...');
        // 1. Fetch News
        const { data: newsData, error: newsError } = await supabase
          .from('news')
          .select('*')
          .order('created_at', { ascending: false });

        if (newsError) {
          console.error('Error fetching news:', newsError);
          throw newsError;
        }

        // If DB is empty, seed it with constants (first run)
        if (!newsData || newsData.length === 0) {
          console.log('News table empty, seeding with constants...');
          const initialItems = [...TOP_NEWS, ...SIDE_NEWS, MIDDLE_FEATURE, ...MIDDLE_LIST];
          const { data: seededData, error: seedError } = await supabase.from('news').insert(
            initialItems.map(n => ({
              id: n.id,
              title: n.title,
              image: n.image,
              description: n.description,
              content: n.content,
              category: n.category,
              section: n.section,
              date: n.date,
              time: n.time,
              is_large: n.isLarge,
              status: 'published'
            }))
          ).select();

          if (seedError) {
            console.error('Error seeding news:', seedError);
            throw seedError;
          }
          if (seededData) {
            setAllNews(seededData.map(mapNewsFromDb));
          }
        } else {
          setAllNews(newsData.map(mapNewsFromDb));
        }

        // Seed Videos if empty
        const { data: videosData, error: vSelectError } = await supabase.from('videos').select('id');
        if (vSelectError && vSelectError.code !== 'PGRST116') {
          console.error('Error checking videos:', vSelectError);
        }

        if (!videosData || videosData.length === 0) {
          console.log('Videos table empty, seeding...');
          const { error: vInsertError } = await supabase.from('videos').insert(
            VIDEOS.map(v => ({
              title: v.title,
              image: v.image,
              thumbnail: v.image, // Use image as fallback if thumbnail missing
              url: v.url || '',
              duration: v.duration || '0:00',
              tag: v.tag || '',
              tag_color: v.tagColor || 'bg-black'
            }))
          );
          if (vInsertError) console.error('Error seeding videos:', vInsertError);
        }

        // 2. Fetch Home Config
        console.log('Fetching home configuration...');
        const { data: configData, error: configError } = await supabase
          .from('home_layout')
          .select('*')
          .eq('id', 1)
          .single();

        if (configError && configError.code !== 'PGRST116') {
          console.warn('Config fetch error (ignoring if not critical):', configError);
        }

        if (configData) {
          setHomeConfig({
            mainHeadline: configData.main_headline,
            heroMainId: configData.hero_main_id,
            heroTopIds: configData.hero_top_ids || [],
            heroSideIds: configData.hero_side_ids || [],
            marianoMainId: configData.mariano_main_id,
            marianoListIds: configData.mariano_list_ids || []
          });
        }
      } catch (err: any) {
        console.error('Critical initialization error:', err);
        setFetchError(err.message || 'Erro inesperado durante a inicialização.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Filter published news for the public pages
  const publishedNews = React.useMemo(() => allNews.filter(n => n.status === 'published'), [allNews]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-black text-gray-500 uppercase tracking-widest text-xs animate-pulse text-primary">Conectando ao banco...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return <ErrorState message={fetchError} />;
  }

  if (allNews.length === 0 && !loading && !fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4 text-center">
        <div className="max-w-md">
          <h2 className="text-xl font-black text-gray-900 mb-2">Inicializando Site</h2>
          <p className="text-gray-500 font-bold mb-4">Estamos preparando as notícias para você. Se este é o primeiro acesso, o banco está sendo configurado.</p>
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }


  const handleSaveNews = async (item: NewsItem) => {
    const dbItem = {
      title: item.title,
      image: item.image,
      description: item.description,
      content: item.content,
      category: item.category,
      section: item.section,
      date: item.date,
      time: item.time,
      is_large: item.isLarge,
      status: item.status,
      updated_at: new Date().toISOString()
    };

    let query;
    if (item.id && item.id.length > 5) { // Assuming UUID length
      query = supabase.from('news').update(dbItem).eq('id', item.id);
    } else {
      query = supabase.from('news').insert([dbItem]);
    }

    const { data, error } = await query.select().single();

    if (error) {
      alert('Erro ao salvar notícia: ' + error.message);
      return;
    }

    const savedItem = mapNewsFromDb(data);
    setAllNews(prev => {
      const index = prev.findIndex(n => n.id === savedItem.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = savedItem;
        return updated;
      }
      return [savedItem, ...prev];
    });
  };

  const handleDeleteNews = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta notícia?')) return;

    const { error } = await supabase.from('news').delete().eq('id', id);

    if (error) {
      alert('Erro ao excluir: ' + error.message);
      return;
    }

    setAllNews(prev => prev.filter(n => n.id !== id));
  };

  const handlePublishNews = async (id: string) => {
    const { error } = await supabase
      .from('news')
      .update({ status: 'published' })
      .eq('id', id);

    if (error) {
      alert('Erro ao publicar: ' + error.message);
      return;
    }

    setAllNews(prev => prev.map(n => n.id === id ? { ...n, status: 'published' } : n));
  };

  const handleUpdateConfig = async (newConfig: HomeLayoutConfig) => {
    const { error } = await supabase
      .from('home_layout')
      .upsert({
        id: 1,
        main_headline: newConfig.mainHeadline,
        hero_main_id: newConfig.heroMainId,
        hero_top_ids: newConfig.heroTopIds,
        hero_side_ids: newConfig.heroSideIds,
        mariano_main_id: newConfig.marianoMainId,
        mariano_list_ids: newConfig.marianoListIds
      });

    if (error) {
      alert('Erro ao salvar configuração: ' + error.message);
      return;
    }

    setHomeConfig(newConfig);
  };

  const NewsEditorWrapper: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const item = allNews.find(n => n.id === id);
    return <NewsForm onSave={handleSaveNews} existingItem={item} />;
  };

  return (
    <div className="min-h-screen flex flex-col font-sans font-bold text-gray-900">
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin/*" element={
          <AdminLayout>
            <Routes>
              <Route path="/" element={<AdminDashboard items={allNews} />} />
              <Route path="/layout" element={
                <AdminHomeConfig
                  items={allNews}
                  config={homeConfig}
                  onUpdate={handleUpdateConfig}
                />
              } />
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
              <Route path="/" element={<HomePage items={publishedNews} config={homeConfig} />} />
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
