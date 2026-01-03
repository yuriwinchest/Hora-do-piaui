import React from 'react';
import { Home } from 'lucide-react';
import { AD_BANNER_IMAGE } from '../constants';

const AdBanner: React.FC = () => {
  return (
    <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 mb-12 flex flex-col md:flex-row items-center justify-between gap-4 relative shadow-sm">
      <div className="flex items-center gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-green-500 p-2 rounded text-white font-bold shadow-md">
          <Home size={24} />
        </div>
        <div>
          <h4 className="font-bold text-gray-800 text-lg">
            casa<span className="text-green-600">legal</span>
          </h4>
          <p className="text-xs text-gray-500">SUA CASA NO SEU NOME</p>
        </div>
      </div>
      
      <div className="flex-1 text-center hidden md:block">
        <img 
          src={AD_BANNER_IMAGE} 
          alt="Família feliz" 
          className="h-20 w-auto mx-auto object-cover rounded shadow-sm opacity-90 mix-blend-multiply hover:scale-105 transition-transform"
        />
      </div>
      
      <div className="bg-yellow-400 text-blue-900 font-bold px-6 py-2 rounded shadow-sm text-center hover:bg-yellow-300 transition-colors cursor-pointer">
        O Governo do Piauí está<br /> mudando a sua vida.
      </div>
      
      <span className="absolute top-1 right-1 text-[8px] text-gray-400 border border-gray-300 px-1 rounded">
        publicidade
      </span>
    </div>
  );
};

export default AdBanner;