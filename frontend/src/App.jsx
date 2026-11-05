import { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

import AdminRoutes from './routes/AdminRoutes';
import WebsiteRoutes from './routes/WebsiteRoutes';

const PageLoader = () => (
  <div style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>
);

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/*" element={<WebsiteRoutes />} />
      </Routes>
    </Suspense>
  );
}
