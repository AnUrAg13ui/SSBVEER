import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#000' }}>
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-8"
        >
            {/* Gold 404 */}
            <div className="relative">
                <p className="text-[10rem] md:text-[14rem] font-black leading-none select-none"
                    style={{ fontFamily: 'Cinzel, serif', color: 'rgba(245,166,35,0.07)', letterSpacing: '-0.05em' }}>
                    404
                </p>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center pulse-glow"
                        style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)' }}>
                        <Shield className="w-10 h-10" style={{ color: '#f5a623' }} />
                    </div>
                </div>
            </div>

            <div>
                <h1 className="text-3xl md:text-4xl font-black text-white mb-3" style={{ fontFamily: 'Cinzel, serif' }}>
                    PAGE NOT FOUND
                </h1>
                <p className="text-sm max-w-sm" style={{ color: '#5a5a5a' }}>
                    This territory doesn't exist on the map. Fall back to base and regroup.
                </p>
            </div>

            {/* Divider */}
            <div className="w-24 h-px" style={{ background: 'linear-gradient(90deg, transparent, #f5a623, transparent)' }} />

            <div className="flex flex-col sm:flex-row gap-4">
                <Link
                    to="/"
                    className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-black text-sm text-black"
                    style={{ background: '#f5a623', fontFamily: 'Cinzel, serif', boxShadow: '0 8px 24px rgba(245,166,35,0.25)' }}
                >
                    <Home className="w-4 h-4" /> Return to Base
                </Link>
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-black text-sm transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'Cinzel, serif' }}
                >
                    <ArrowLeft className="w-4 h-4" /> Go Back
                </button>
            </div>
        </motion.div>
    </div>
);

export default NotFound;
