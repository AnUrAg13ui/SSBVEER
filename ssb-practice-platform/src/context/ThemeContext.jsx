import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('ssb_theme') || 'dark';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'light') {
            root.classList.add('light');
            root.classList.remove('dark');
        } else {
            root.classList.remove('light');
            root.classList.add('dark');
        }
        localStorage.setItem('ssb_theme', theme);
    }, [theme]);

    // Apply theme immediately on mount (before first render flicker)
    useEffect(() => {
        const saved = localStorage.getItem('ssb_theme') || 'dark';
        const root = window.document.documentElement;
        if (saved === 'light') {
            root.classList.add('light');
        } else {
            root.classList.add('dark');
        }
    }, []);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
