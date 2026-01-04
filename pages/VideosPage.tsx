import React, { useState, useEffect } from 'react';
import VideoCard from '../components/VideoCard';
import { PageContainer } from '../components/common/PageContainer';
import { supabase } from '../lib/supabase';

const VideosPage: React.FC = () => {
    const [videos, setVideos] = useState<any[]>([]);

    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase.from('horapiaui_videos').select('*').order('created_at', { ascending: false });
            if (data) setVideos(data);
        };
        fetch();
    }, []);

    return (
        <PageContainer title="Vídeos">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {videos.map(video => (
                    <VideoCard key={video.id} item={video} />
                ))}
            </div>
        </PageContainer>
    );
};

export default VideosPage;
