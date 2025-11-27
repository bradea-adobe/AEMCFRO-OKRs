// Main App Component with Routing

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Admin } from './components/Admin/Admin';
import { Tracker } from './components/Tracker/Tracker';

const App: React.FC = () => {
  console.log('🎨 App component rendering...');
  
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/tracker" element={<Tracker />} />
        </Routes>
      </Layout>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
};

console.log('✅ App component defined');
export default App;

