import React from 'react';
import { ChevronDown } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white py-12 mt-12">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
        <div className="flex items-center gap-1 mb-8">
          <span className="text-primary text-4xl font-bold font-serif">H</span>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-lg text-primary tracking-widest">ORA</span>
            <span className="text-xs text-gray-400">piauí.com</span>
          </div>
        </div>
        
        <nav className="flex flex-wrap justify-center gap-8 text-sm text-gray-400 uppercase tracking-wider font-medium">
          <a href="#" className="hover:text-white transition-colors">Destaque</a>
          <a href="#" className="hover:text-white transition-colors flex items-center gap-1">
            Coluna Mariano Wikoli
            <ChevronDown size={16} />
          </a>
          <a href="#" className="hover:text-white transition-colors">Política</a>
          <a href="#" className="hover:text-white transition-colors">Geral</a>
          <a href="#" className="hover:text-white transition-colors">Vídeo</a>
        </nav>
        
        <div className="mt-12 text-center text-xs text-gray-600">
          © 2025 Hora Piauí. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;