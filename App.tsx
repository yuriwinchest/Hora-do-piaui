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

const getAllNews = (): NewsItem[] => {
  const items: NewsItem[] = [...TOP_NEWS, ...SIDE_NEWS, MIDDLE_FEATURE, ...MIDDLE_LIST];
  const map = new Map<string, NewsItem>();
  for (const item of items) {
    map.set(item.id, item);
  }
  return Array.from(map.values());
};

const ALL_NEWS = getAllNews();

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

const NewsFeedPage: React.FC<{ title: string; kind: 'politica' | 'geral' | 'coluna-mariano' }> = ({ title, kind }) => {
  const items = React.useMemo(() => {
    if (kind === 'coluna-mariano') return ALL_NEWS.filter((n) => n.category === 'coluna-mariano');
    return ALL_NEWS.filter((n) => normalizeText(n.section ?? '') === kind);
  }, [kind]);

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

const NewsDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const item = React.useMemo(() => ALL_NEWS.find((n) => n.id === id), [id]);

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

      {item.description && (
        <p className="text-base text-gray-800 font-sans leading-relaxed">
          {item.description}
        </p>
      )}
    </PageContainer>
  );
};

const HomePage: React.FC = () => {
  const videoCarouselRef = React.useRef<HTMLDivElement | null>(null);

  const scrollVideoCarousel = React.useCallback((direction: 'left' | 'right') => {
    const el = videoCarouselRef.current;
    if (!el) return;
    const step = 192;
    el.scrollBy({ left: direction === 'left' ? -step : step, behavior: 'smooth' });
  }, []);

  const homeMiddleList = React.useMemo(
    () => MIDDLE_LIST.filter((item) => item.category === 'coluna-mariano'),
    []
  );

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
            {TOP_NEWS.map((item) => (
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
            {SIDE_NEWS.map((item) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-12 items-stretch">
        <div className="lg:col-span-5 h-full">
          <NewsCard item={MIDDLE_FEATURE} variant="vertical" imageClassName="aspect-square" />
        </div>
        <div className="lg:col-span-7 h-full flex flex-col divide-y divide-gray-100">
          {homeMiddleList.slice(0, 4).map((item) => (
            <NewsListItem key={item.id} item={item} className="flex-1" />
          ))}
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

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans font-bold text-gray-900">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/politica" element={<NewsFeedPage title="Política" kind="politica" />} />
        <Route path="/geral" element={<NewsFeedPage title="Geral" kind="geral" />} />
        <Route path="/coluna-mariano" element={<NewsFeedPage title="Coluna Mariano Wikoli" kind="coluna-mariano" />} />
        <Route path="/videos" element={<VideosPage />} />
        <Route path="/noticia/:id" element={<NewsDetailPage />} />
      </Routes>

      <Footer />
    </div>
  );
};

export default App;
