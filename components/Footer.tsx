import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white py-12 mt-12">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
        <Link to="/" className="mb-8 hover:opacity-80 transition-opacity">
          <img src="/assets/logo.png" alt="Hora Piauí" className="h-12 w-auto object-contain" />
        </Link>

        <nav className="flex flex-wrap justify-center gap-8 text-sm text-gray-400 uppercase tracking-wider font-bold">
          <Link to="/" className="hover:text-white transition-colors">Destaque</Link>
          <Link to="/coluna-mariano" className="hover:text-white transition-colors flex items-center gap-1">
            Coluna Mariano Wikoli
            <ChevronDown size={16} />
          </Link>
          <Link to="/politica" className="hover:text-white transition-colors">Política</Link>
          <Link to="/geral" className="hover:text-white transition-colors">Geral</Link>
          <Link to="/videos" className="hover:text-white transition-colors">Vídeo</Link>
        </nav>

        <div className="mt-12 text-center text-xs text-gray-600">
          © 2025 Hora Piauí. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
