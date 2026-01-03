import React from 'react';
import { BANNER_AVATAR } from '../constants';

const GamesBanner: React.FC = () => {
  return (
    <div className="w-full bg-gradient-to-r from-green-900 via-green-700 to-green-900 rounded-lg h-32 flex items-center justify-center mb-12 relative overflow-hidden group cursor-pointer shadow-lg">
      <div className="absolute inset-0 bg-black opacity-30 pattern-dots"></div>
      
      <div className="relative z-10 flex items-center gap-4">
        <span className="text-4xl font-black text-white italic tracking-tighter drop-shadow-md">7GAMES</span>
        <div className="bg-yellow-400 text-black font-bold px-3 py-1 rounded skew-x-[-12deg] text-sm shadow">
          APOSTAS COM CASHBACK
        </div>
        <img 
          src={BANNER_AVATAR} 
          alt="Avatar" 
          className="rounded-full w-12 h-12 border-2 border-white shadow-md"
        />
      </div>
      <span className="absolute top-2 right-2 text-[10px] text-white/50 border border-white/20 px-1 rounded">
        publicidade
      </span>
    </div>
  );
};

export default GamesBanner;