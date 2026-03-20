import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
    const { isAuth, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#070c18] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                <p className="text-blue-500 font-bold font-outfit text-xl animate-pulse">Initializing Session...</p>
            </div>
        );
    }

    if (!isAuth) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    return children;
};

export default ProtectedRoute;
