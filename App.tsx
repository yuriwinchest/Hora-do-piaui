import React from 'react';
import { Reply } from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';
import NewsCard from './components/NewsCard';
import NewsListItem from './components/NewsListItem';
import VideoCard from './components/VideoCard';
import GamesBanner from './components/GamesBanner';
import AdBanner from './components/AdBanner';
import { 
  TOP_NEWS, 
  SIDE_NEWS, 
  SUB_NAV, 
  MIDDLE_FEATURE, 
  MIDDLE_LIST, 
  DARK_FEATURE_IMAGE,
  VIDEOS 
} from './constants';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900">
      <Header />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
        {/* Main Headline with "Highlighter" effect: White text on Green background */}
        <h1 className="text-4xl md:text-5xl font-black mb-8 font-serif leading-tight">
          <span className="bg-[#00C24A] text-white px-2 box-decoration-clone leading-[1.3] inline-block">
            Trump anuncia ataque à Venezuela
          </span>
        </h1>
        
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 border-b border-gray-200 pb-12">
          {/* Main Cards (Left) */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              {TOP_NEWS.map((item) => (
                <div key={item.id} className="h-full">
                    <div className="h-full relative flex flex-col">
                        <div className="overflow-hidden rounded-lg mb-3 bg-gray-100 shadow-md aspect-[4/3]">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500" />
                        </div>
                        <h2 className="text-xl font-bold font-serif leading-snug hover:text-primary transition-colors cursor-pointer">
                            {item.title}
                        </h2>
                    </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Side List (Right) */}
          <div className="lg:col-span-4 pl-0 lg:pl-8 lg:border-l border-gray-200 flex flex-col gap-6">
            <div className="space-y-6 divide-y divide-gray-100">
                {SIDE_NEWS.map((item) => (
                <div key={item.id} className="pt-6 first:pt-0">
                    <NewsCard item={item} variant="compact" showDescription={true} />
                </div>
                ))}
            </div>
          </div>
        </div>
        
        <GamesBanner />
        
        {/* Sub Navigation */}
        <div className="flex items-center justify-between border-b-2 border-gray-100 mb-6">
          <div className="flex gap-8 overflow-x-auto">
            {SUB_NAV.map((item) => (
              <a 
                key={item.label} 
                href={item.href} 
                className={`pb-2 border-b-2 font-bold uppercase text-sm tracking-wide whitespace-nowrap transition-all ${
                  item.isActive 
                    ? 'border-black text-gray-900' 
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>
          <button className="text-gray-400 hover:text-primary transform -scale-x-100">
            <Reply size={24} />
          </button>
        </div>
        
        {/* Middle Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-12">
          <div className="lg:col-span-5 h-full">
            <NewsCard item={MIDDLE_FEATURE} variant="vertical" />
          </div>
          <div className="lg:col-span-7 flex flex-col gap-1">
            {MIDDLE_LIST.map((item) => (
              <NewsListItem key={item.id} item={item} />
            ))}
          </div>
        </div>
        
        <AdBanner />
        
        {/* Dark Feature Section */}
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
        
        {/* Video Section */}
        <div className="mb-12">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">
            Assista aos vídeos de hoje
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {VIDEOS.map((video) => (
              <VideoCard key={video.id} item={video} />
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default App;
