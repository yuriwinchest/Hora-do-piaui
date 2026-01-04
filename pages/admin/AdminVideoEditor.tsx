import React from 'react';
import { useParams } from 'react-router-dom';
import VideoForm from '../../components/admin/VideoForm';
import { VideoItem } from '../../types';

interface AdminVideoEditorProps {
    items: VideoItem[];
    onSave: (item: VideoItem) => Promise<void>;
}

const AdminVideoEditor: React.FC<AdminVideoEditorProps> = ({ items, onSave }) => {
    const { id } = useParams<{ id: string }>();
    const item = items.find(v => v.id === id);

    const handleSave = async (data: VideoItem) => {
        await onSave(data);
    };

    return <VideoForm onSave={handleSave} existingItem={item} />;
};

export default AdminVideoEditor;
