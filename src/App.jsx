import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FavoritesDrawer from './components/FavoritesDrawer';
import ScrollToTop from './components/ScrollToTop';
import RouteSeo from './components/RouteSeo';
import LoadingState from './components/LoadingState';
import HomePage from './pages/HomePage';

// Route-level code splitting. HomePage stays eager (it's the landing route, so
// there's no point deferring it). Every other page is loaded on demand, which
// keeps the initial bundle small and speeds up first paint. The Suspense
// fallback below covers the brief chunk fetch on first visit to each route.
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const ListingDetailPage = lazy(() => import('./pages/ListingDetailPage'));
const AddListingPage = lazy(() => import('./pages/AddListingPage'));
const EditListingPage = lazy(() => import('./pages/EditListingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AllListingsPage = lazy(() => import('./pages/AllListingsPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const MyListingsPage = lazy(() => import('./pages/MyListingsPage'));
const SavedListingsPage = lazy(() => import('./pages/SavedListingsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SellerProfilePage = lazy(() => import('./pages/SellerProfilePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ShopsPage = lazy(() => import('./pages/ShopsPage'));
const ShopDetailPage = lazy(() => import('./pages/ShopDetailPage'));
const ManageShopPage = lazy(() => import('./pages/ManageShopPage'));
const BusinessApplyPage = lazy(() => import('./pages/BusinessApplyPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Gate a route behind authentication. Unauthenticated users are sent to the
// login page with a `redirect` param so they return here after signing in.
function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  // Wait for session rehydration before deciding — otherwise a refresh on a
  // protected route would bounce a logged-in user to login mid-load.
  if (loading) return null;
  if (!isAuthenticated) {
    const dest = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${dest}`} replace />;
  }
  return children;
}

// Admin-only gate. Requires auth + the `admin` role; others are redirected.
function RequireAdmin({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!isAuthenticated) {
    const dest = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${dest}`} replace />;
  }
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const location = useLocation();

  return (
    <>
      <ScrollToTop />
      <RouteSeo />
      <Navbar />
      <FavoritesDrawer />
      <Suspense fallback={<LoadingState label="Loading…" />}>
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/"                  element={<HomePage />} />
          <Route path="/category/:slug"    element={<CategoryPage />} />
          <Route path="/listing/:id"       element={<ListingDetailPage />} />
          <Route path="/add-listing"       element={<RequireAuth><AddListingPage /></RequireAuth>} />
          <Route path="/edit-listing/:id"  element={<RequireAuth><EditListingPage /></RequireAuth>} />
          <Route path="/login"             element={<LoginPage />} />
          <Route path="/listings"          element={<AllListingsPage />} />
          <Route path="/browse"            element={<AllListingsPage />} />
          <Route path="/dashboard"         element={<RequireAuth><DashboardPage /></RequireAuth>} />
          <Route path="/my-listings"       element={<RequireAuth><MyListingsPage /></RequireAuth>} />
          <Route path="/saved-listings"    element={<RequireAuth><SavedListingsPage /></RequireAuth>} />
          <Route path="/profile"           element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/seller/:sellerName" element={<SellerProfilePage />} />
          <Route path="/shops"             element={<ShopsPage />} />
          <Route path="/shops/:id"         element={<ShopDetailPage />} />
          <Route path="/my-shop"           element={<RequireAuth><ManageShopPage /></RequireAuth>} />
          <Route path="/apply-business"    element={<RequireAuth><BusinessApplyPage /></RequireAuth>} />
          <Route path="/about"             element={<AboutPage />} />
          <Route path="/contact"           element={<ContactPage />} />
          <Route path="/terms"             element={<LegalPage doc="terms" />} />
          <Route path="/privacy"           element={<LegalPage doc="privacy" />} />
          <Route path="/safety"            element={<LegalPage doc="safety" />} />
          <Route path="/admin"             element={<RequireAdmin><AdminPage /></RequireAdmin>} />
          <Route path="*"                  element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>
      </Suspense>
      <Footer />
    </>
  );
}
