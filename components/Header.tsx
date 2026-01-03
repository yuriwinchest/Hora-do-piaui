import React from 'react';
import { HEADER_NAV } from '../constants';

const Header: React.FC = () => {
  return (
    <header className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-4 md:mb-0">
          {/* Logo Construction */}
          <a href="#" className="flex items-center gap-2 group hover:opacity-90 transition-opacity">
            <div className="flex items-center">
              {/* The H */}
              <span className="text-6xl font-black text-[#00C24A] tracking-tighter leading-none font-sans">H</span>
              {/* The Clock Icon */}
              <div className="relative w-10 h-10 border-[4px] border-[#00C24A] rounded-full mx-1 flex items-center justify-center bg-white">
                {/* Minute Hand */}
                <div className="absolute w-1 h-3.5 bg-[#00C24A] top-1.5 rounded-full origin-bottom"></div>
                {/* Hour Hand */}
                <div className="absolute w-1 h-2.5 bg-[#00C24A] top-1/2 left-1/2 -translate-x-1/2 origin-top rounded-full rotate-90 -translate-y-[2px]"></div>
              </div>
            </div>
            <div className="flex flex-col justify-center leading-none -ml-1">
              <span className="text-4xl font-black text-[#00C24A] tracking-tighter font-sans">HORA</span>
              <span className="text-xl font-bold text-[#00C24A] tracking-tight -mt-1 font-sans">piauí.com</span>
            </div>
          </a>

          <nav className="flex flex-wrap justify-center gap-6 text-sm md:text-base font-black text-gray-600 md:mb-1">
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
