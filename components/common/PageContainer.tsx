import React from 'react';

interface PageContainerProps {
    title: string;
    children: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({ title, children }) => {
    return (
        <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
            <h1 className="text-3xl md:text-4xl font-bold font-serif leading-tight mb-6">
                {title}
            </h1>
            {children}
        </main>
    );
};
