import React from 'react';
import { Menu, X, Newspaper } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { HEADER_NAV } from '../constants';
import NewsListModal from './common/NewsListModal';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isNewsModalOpen, setIsNewsModalOpen] = React.useState(false);

  return (
    <header className="border-b border-gray-200">
      <NewsListModal isOpen={isNewsModalOpen} onClose={() => setIsNewsModalOpen(false)} />

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-white/95 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-end">
              <button
                type="button"
                aria-label="Fechar menu"
                className="p-2 -mr-2 text-gray-700 hover:text-primary transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X size={28} />
              </button>
            </div>
            <nav className="mt-2 flex flex-col gap-5 text-lg font-black text-gray-800">
              {HEADER_NAV.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.href}
                  className={({ isActive }) =>
                    `hover:text-primary transition-colors ${isActive ? 'text-primary' : ''}`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between">
        <div className="md:hidden absolute right-4 top-6 flex items-center gap-2">
          <button
            type="button"
            aria-label="Últimas Notícias"
            className="p-2 text-gray-700 hover:text-primary transition-colors"
            onClick={() => setIsNewsModalOpen(true)}
          >
            <Newspaper size={24} />
          </button>
          <button
            type="button"
            aria-label="Abrir menu"
            className="p-2 -mr-2 text-gray-700 hover:text-primary transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={28} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-4 md:mb-0">
          <div className="w-full flex items-center justify-center md:w-auto md:justify-start">
            <Link to="/" className="group hover:opacity-90 transition-opacity">
              <img src="/assets/logo.png" alt="Hora Piauí" className="h-16 md:h-20 w-auto object-contain" />
            </Link>
          </div>

          <nav className="hidden md:flex flex-wrap justify-center gap-8 text-lg font-black text-black md:mb-1">
            {HEADER_NAV.map((item) => (
              <NavLink
                key={item.label}
                to={item.href}
                className="hover:text-primary transition-colors text-black"
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="text-xs text-gray-500 font-sans">
          Terça-feira, 24 de Outubro
        </div>
      </div>
    </header>
  );
};

export default Header;
