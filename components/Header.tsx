import React, { useMemo } from 'react';
import { Menu, X, Newspaper } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { HEADER_NAV } from '../constants';
import NewsListModal from './common/NewsListModal';

const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const MESES_HEADER = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function getDataAtualBR(): string {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const dia = DIAS_SEMANA[now.getDay()];
  const num = now.getDate();
  const mes = MESES_HEADER[now.getMonth()];
  return `${dia}, ${num} de ${mes}`;
}

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isNewsModalOpen, setIsNewsModalOpen] = React.useState(false);
  const dataAtual = useMemo(() => getDataAtualBR(), []);

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

        <div className="w-full flex items-center justify-center md:w-auto md:justify-start mb-4 md:mb-0">
          <Link to="/" className="group hover:opacity-90 transition-opacity">
            <img src="/assets/logo.png" alt="Hora Piauí" className="h-12 md:h-16 w-auto object-contain" />
          </Link>
        </div>

        <nav className="hidden md:flex flex-1 justify-center items-center gap-8 text-lg font-black text-black px-4">
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

        <div className="flex flex-col items-center md:items-end gap-2">
          <div className="text-[10px] md:text-xs text-gray-500 font-sans font-bold uppercase tracking-wider">
            {dataAtual}
          </div>
          
          <div className="relative group w-full max-w-[200px] md:max-w-[240px]">
            <input 
              type="text"
              placeholder="Buscar notícias..."
              className="w-full bg-gray-50 border border-gray-200 rounded-full py-2 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm hover:shadow-md"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // Aqui dispararemos a busca no modal
                  setIsNewsModalOpen(true);
                  // Podemos usar um evento customizado ou passar via prop se refatorarmos o modal
                  window.dispatchEvent(new CustomEvent('news-search', { detail: e.currentTarget.value }));
                }
              }}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
