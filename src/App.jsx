import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FavoritesDrawer from './components/FavoritesDrawer';
import ScrollToTop from './components/ScrollToTop';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import ListingDetailPage from './pages/ListingDetailPage';
import AddListingPage from './pages/AddListingPage';
import EditListingPage from './pages/EditListingPage';
import LoginPage from './pages/LoginPage';
import AllListingsPage from './pages/AllListingsPage';
import DashboardPage from './pages/DashboardPage';
import MyListingsPage from './pages/MyListingsPage';
import SavedListingsPage from './pages/SavedListingsPage';
import ProfilePage from './pages/ProfilePage';
import SellerProfilePage from './pages/SellerProfilePage';
import AdminPage from './pages/AdminPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import NotFoundPage from './pages/NotFoundPage';

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
      <Navbar />
      <FavoritesDrawer />
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
          <Route path="/about"             element={<AboutPage />} />
          <Route path="/contact"           element={<ContactPage />} />
          <Route path="/admin"             element={<RequireAdmin><AdminPage /></RequireAdmin>} />
          <Route path="*"                  element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>
      <Footer />
    </>
  );
}
