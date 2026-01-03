import React from 'react';
import { Menu, X } from 'lucide-react';
import { HEADER_NAV } from '../constants';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <header className="border-b border-gray-200">
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
                <a
                  key={item.label}
                  href={item.href}
                  className="hover:text-primary transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between">
        <button
          type="button"
          aria-label="Abrir menu"
          className="md:hidden absolute right-4 top-6 p-2 -mr-2 text-gray-700 hover:text-primary transition-colors"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu size={28} />
        </button>

        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-4 md:mb-0">
          {/* Logo Construction */}
          <div className="w-full flex items-center justify-center md:w-auto md:justify-start">
            <a href="#" className="flex items-center gap-2 group hover:opacity-90 transition-opacity">
              <div className="flex items-center">
                <span className="text-6xl font-black text-[#00C24A] tracking-tighter leading-none font-sans">H</span>
                <div className="relative w-10 h-10 border-[4px] border-[#00C24A] rounded-full mx-1 flex items-center justify-center bg-white">
                  <div className="absolute w-1 h-3.5 bg-[#00C24A] top-1.5 rounded-full origin-bottom"></div>
                  <div className="absolute w-1 h-2.5 bg-[#00C24A] top-1/2 left-1/2 -translate-x-1/2 origin-top rounded-full rotate-90 -translate-y-[2px]"></div>
                </div>
              </div>
              <div className="flex flex-col justify-center leading-none -ml-1">
                <span className="text-4xl font-black text-[#00C24A] tracking-tighter font-sans">HORA</span>
                <span className="text-xl font-bold text-[#00C24A] tracking-tight -mt-1 font-sans">piauí.com</span>
              </div>
            </a>
          </div>

          <nav className="hidden md:flex flex-wrap justify-center gap-6 text-sm md:text-base font-black text-gray-600 md:mb-1">
            {HEADER_NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="hover:text-primary transition-colors"
              >
                {item.label}
              </a>
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
