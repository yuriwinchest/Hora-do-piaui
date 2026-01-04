
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import NewsFeedPage from './pages/NewsFeedPage';
import VideosPage from './pages/VideosPage';
import NewsDetailPage from './pages/NewsDetailPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminNewsPage from './pages/admin/AdminNewsPage';
import AdminNewsEditor from './pages/admin/AdminNewsEditor';
import AdminLayoutPage from './pages/admin/AdminLayoutPage';
import AdminLayout from './components/admin/AdminLayout';
import { useNews } from './hooks/useNews';
import { ErrorState } from './components/common/ErrorState';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  const {
    allNews,
    videos,
    homeConfig,
    loading,
    fetchError,
    saveNews,
    deleteNews,
    publishNews,
    updateHomeConfig
  } = useNews();

  if (loading && !allNews.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (fetchError && !allNews.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <ErrorState
          message={fetchError}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          <>
            <Header />
            <HomePage
              items={allNews}
              videos={videos}
              config={homeConfig}
            />
            <Footer />
          </>
        } />

        <Route path="/politica" element={
          <>
            <Header />
            <NewsFeedPage items={allNews} category="politica" />
            <Footer />
          </>
        } />

        <Route path="/policia" element={
          <>
            <Header />
            <NewsFeedPage items={allNews} category="policia" />
            <Footer />
          </>
        } />

        <Route path="/geral" element={
          <>
            <Header />
            <NewsFeedPage items={allNews} category="geral" />
            <Footer />
          </>
        } />

        <Route path="/videos" element={
          <>
            <Header />
            <VideosPage videos={videos} />
            <Footer />
          </>
        } />

        <Route path="/noticia/:slug" element={
          <>
            <Header />
            <NewsDetailPage />
            <Footer />
          </>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminLayout>
            <AdminDashboard items={allNews} />
          </AdminLayout>
        } />

        <Route path="/admin/noticias" element={
          <AdminLayout>
            <AdminNewsPage
              items={allNews}
              onDelete={deleteNews}
              onPublish={publishNews}
            />
          </AdminLayout>
        } />

        <Route path="/admin/noticia/nova" element={
          <AdminLayout>
            <AdminNewsEditor onSave={saveNews} />
          </AdminLayout>
        } />

        <Route path="/admin/noticia/:id" element={
          <AdminLayout>
            <AdminNewsEditor onSave={saveNews} />
          </AdminLayout>
        } />

        <Route path="/admin/layout" element={
          <AdminLayout>
            <AdminLayoutPage
              config={homeConfig}
              onUpdate={updateHomeConfig}
            />
          </AdminLayout>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
