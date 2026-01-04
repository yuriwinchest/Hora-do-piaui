import React from 'react';
import AdminHomeConfig from '../../components/admin/AdminHomeConfig';
import { NewsItem, HomeLayoutConfig } from '../../types';

interface AdminLayoutPageProps {
    items: NewsItem[];
    config: HomeLayoutConfig;
    onUpdate: (config: HomeLayoutConfig) => Promise<void>;
    onSaveNews: (item: NewsItem) => Promise<void>;
}

const AdminLayoutPage: React.FC<AdminLayoutPageProps> = ({ items, config, onUpdate, onSaveNews }) => {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Layout da Home</h1>
                <p className="text-gray-500 font-bold">Defina quais notícias aparecem em destaque.</p>
            </div>

            <AdminHomeConfig items={items} config={config} onUpdate={onUpdate} onSaveNews={onSaveNews} />
        </div>
    );
};
export default AdminLayoutPage;
