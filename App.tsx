import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import AdminLayout from './components/admin/AdminLayout';
import { ErrorState } from './components/common/ErrorState';
import { useNews } from './hooks/useNews';

// Import Pages
import HomePage from './pages/HomePage';
import NewsFeedPage from './pages/NewsFeedPage';
import VideosPage from './pages/VideosPage';
import NewsDetailPage from './pages/NewsDetailPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminNewsPage from './pages/admin/AdminNewsPage';
import AdminNewsEditor from './pages/admin/AdminNewsEditor';
import AdminLayoutPage from './pages/admin/AdminLayoutPage';

// ScrollToTop
const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

function App() {
  const {
    allNews,
    publishedNews,
    homeConfig,
    loading,
    fetchError,
    saveNews,
    deleteNews,
    publishNews,
    updateHomeConfig
  } = useNews();

  // Loading Screen
  if (loading && !allNews.length) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
        </div>
        <p className="mt-8 text-white font-black tracking-widest text-xs animate-pulse">
          CONECTANDO AO BANCO...
        </p>
      </div>
    );
  }

  // Error State
  if (fetchError && !allNews.length) {
    return <ErrorState message={fetchError} />;
  }

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<><Header /><HomePage items={publishedNews} config={homeConfig} /><Footer /></>} />
        <Route path="/noticia/:slug" element={<><Header /><NewsDetailPage items={publishedNews} /><Footer /></>} />
        <Route path="/politica" element={<><Header /><NewsFeedPage title="Política" category="politica" items={publishedNews} /><Footer /></>} />
        <Route path="/policia" element={<><Header /><NewsFeedPage title="Polícia" category="policia" items={publishedNews} /><Footer /></>} />
        <Route path="/geral" element={<><Header /><NewsFeedPage title="Geral" category="geral" items={publishedNews} /><Footer /></>} />
        <Route path="/famosos" element={<><Header /><NewsFeedPage title="Famosos" category="famosos" items={publishedNews} /><Footer /></>} />
        <Route path="/videos" element={<><Header /><VideosPage /><Footer /></>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout><AdminDashboard items={allNews} /></AdminLayout>} />

        <Route path="/admin/noticias" element={<AdminLayout><AdminNewsPage items={allNews} onDelete={deleteNews} onPublish={publishNews} /></AdminLayout>} />

        {/* Specific 'nova' route first to avoid ID collision */}
        <Route path="/admin/noticia/nova" element={<AdminLayout><AdminNewsEditor items={allNews} onSave={saveNews} /></AdminLayout>} />
        <Route path="/admin/noticia/:id" element={<AdminLayout><AdminNewsEditor items={allNews} onSave={saveNews} /></AdminLayout>} />

        <Route path="/admin/layout" element={<AdminLayout><AdminLayoutPage items={allNews} config={homeConfig} onUpdate={updateHomeConfig} /></AdminLayout>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
