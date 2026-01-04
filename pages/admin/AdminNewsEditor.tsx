import React from 'react';
import { useParams } from 'react-router-dom';
import NewsForm from '../../components/admin/NewsForm';
import { NewsItem } from '../../types';

interface AdminNewsEditorProps {
    items: NewsItem[];
    onSave: (item: NewsItem) => Promise<void>;
}

const AdminNewsEditor: React.FC<AdminNewsEditorProps> = ({ items, onSave }) => {
    // If id is 'nova', items.find returns undefined, creating a new item. Perfect.
    const { id } = useParams<{ id: string }>();
    const item = items.find(n => n.id === id);

    // Wrapper to ensure Promise type match if needed, though NewsForm likely handles it
    const handleSave = async (data: NewsItem) => {
        await onSave(data);
    };

    return <NewsForm onSave={handleSave} existingItem={item} />;
};
export default AdminNewsEditor;
