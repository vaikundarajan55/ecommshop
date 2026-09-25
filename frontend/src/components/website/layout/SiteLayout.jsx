import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Header from './Header';
import Footer from './Footer';
import { trackVisit } from '../../../store/slices/website/cmsSlice';

export default function SiteLayout() {
  const { pathname, search } = useLocation();
  const url = pathname + search;
  const lastTracked = useRef(null);
  const dispatch = useDispatch();

  // Log each page view for admin > Visitors (the server reads the IP address)
  useEffect(() => {
    if (lastTracked.current === url) return; // StrictMode runs effects twice in dev
    lastTracked.current = url;
    dispatch(trackVisit({ path: url, referrer: document.referrer || null }));
  }, [dispatch, url]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
