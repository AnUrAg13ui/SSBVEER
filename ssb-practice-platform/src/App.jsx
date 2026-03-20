import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import TestList from './pages/tests/TestList';
import TestPlayer from './pages/tests/TestPlayer';
import PPDTPlayer from './pages/tests/PPDTPlayer';
import Interview from './pages/Interview';
import Leaderboard from './pages/Leaderboard';
import GuideList from './pages/guides/GuideList';
import Forum from './pages/Forum';
import Progress from './pages/Progress';
import GTOSimulator from './pages/tests/GTOSimulator';
import PIQForm from './pages/PIQForm';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import AIChatbot from './components/chat/AIChatbot';
import MobilePage from './pages/MobilePage';
import CommandTask from './pages/tests/CommandTask';
import GPESimulator from './pages/tests/GPESimulator';
import AdminLogin from './pages/admin/AdminLogin';
import AdminPanel from './pages/admin/AdminPanel';
import SDTTest from './pages/tests/SDTTest';
import Lecturette from './pages/tests/Lecturette';
import { Shield } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';


// ─── Full-screen loader shown during initial auth check ───────────────────────
const AppLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-5" style={{ background: '#000' }}>
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(245,166,35,0.15)', borderTopColor: '#f5a623' }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <Shield className="w-7 h-7" style={{ color: '#f5a623' }} />
      </div>
    </div>
    <p className="text-xs font-black tracking-widest uppercase" style={{ color: '#3a3a3a', fontFamily: 'Cinzel, serif' }}>Authenticating...</p>
  </div>
);

// ─── Page transition wrapper ──────────────────────────────────────────────────
const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.22, ease: 'easeInOut' }}
  >
    {children}
  </motion.div>
);

// ─── Animated routes (needs to be inside Router) ─────────────────────────────
const AnimatedRoutes = () => {
  const location = useLocation();
  const { loading } = useAuth();

  if (loading) return <AppLoader />;

  // Determine the top-level route group key to avoid remounting the app shell continuously
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/signup';
  const topLevelKey = isAuthRoute ? location.pathname : 'app-shell';

  const isSimulation = location.pathname === '/gto-simulator' && location.search.includes('type=');

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={topLevelKey}>

        {/* Public — no Navbar */}
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/signup" element={<PageWrapper><Signup /></PageWrapper>} />
        <Route path="/mobile/:sessionId" element={<MobilePage />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/panel" element={<AdminPanel />} />

        {/* App shell — with Navbar + Chatbot */}
        <Route path="/*" element={
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            {!isSimulation && <Navbar />}
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
                <Route path="/dashboard" element={<ProtectedRoute><PageWrapper><Dashboard /></PageWrapper></ProtectedRoute>} />
                <Route path="/tests" element={<ProtectedRoute><PageWrapper><TestList /></PageWrapper></ProtectedRoute>} />
                <Route path="/tests/:id" element={<ProtectedRoute><PageWrapper><TestPlayer /></PageWrapper></ProtectedRoute>} />
                <Route path="/ppdt/:id" element={<ProtectedRoute><PageWrapper><PPDTPlayer /></PageWrapper></ProtectedRoute>} />
                <Route path="/interview" element={<ProtectedRoute><PageWrapper><Interview /></PageWrapper></ProtectedRoute>} />
                <Route path="/leaderboard" element={<ProtectedRoute><PageWrapper><Leaderboard /></PageWrapper></ProtectedRoute>} />
                <Route path="/oir-guide" element={<ProtectedRoute><PageWrapper><GuideList /></PageWrapper></ProtectedRoute>} />
                <Route path="/oir-guide/:id" element={<ProtectedRoute><PageWrapper><GuideList /></PageWrapper></ProtectedRoute>} />
                <Route path="/forum" element={<ProtectedRoute><PageWrapper><Forum /></PageWrapper></ProtectedRoute>} />
                <Route path="/progress" element={<ProtectedRoute><PageWrapper><Progress /></PageWrapper></ProtectedRoute>} />
                <Route path="/gto-simulator" element={<ProtectedRoute><PageWrapper><GTOSimulator /></PageWrapper></ProtectedRoute>} />
                <Route path="/command-task" element={<ProtectedRoute><PageWrapper><CommandTask /></PageWrapper></ProtectedRoute>} />
                <Route path="/gpe-simulator" element={<ProtectedRoute><PageWrapper><GPESimulator /></PageWrapper></ProtectedRoute>} />
                <Route path="/sdt" element={<ProtectedRoute><PageWrapper><SDTTest /></PageWrapper></ProtectedRoute>} />
                <Route path="/lecturette" element={<ProtectedRoute><PageWrapper><Lecturette /></PageWrapper></ProtectedRoute>} />
                <Route path="/piq" element={<ProtectedRoute><PageWrapper><PIQForm /></PageWrapper></ProtectedRoute>} />
                <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
              </Routes>
            </AnimatePresence>
            {!isSimulation && <AIChatbot />}
          </motion.div>
        } />
      </Routes>
    </AnimatePresence>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Router>
              <div className="min-h-screen text-white selection:bg-amber-500/25">
                <AnimatedRoutes />
              </div>
            </Router>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
