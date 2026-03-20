import { Component } from 'react';
import { Shield, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6" style={{ background: '#000' }}>
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <Shield className="w-10 h-10" style={{ color: '#ef4444' }} />
                    </div>
                    <div className="text-center max-w-md">
                        <h1 className="text-3xl font-black text-white mb-3" style={{ fontFamily: 'Cinzel, serif' }}>SOMETHING WENT WRONG</h1>
                        <p className="text-sm mb-2" style={{ color: '#5a5a5a' }}>
                            An unexpected error occurred. This has been noted.
                        </p>
                        <p className="text-xs font-mono px-4 py-2 rounded-lg mt-3" style={{ background: 'rgba(239,68,68,0.05)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.12)' }}>
                            {this.state.error?.message || 'Unknown error'}
                        </p>
                    </div>
                    <button
                        onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-black text-sm"
                        style={{ background: '#f5a623', fontFamily: 'Cinzel, serif' }}
                    >
                        <RefreshCw className="w-4 h-4" /> Reload App
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
