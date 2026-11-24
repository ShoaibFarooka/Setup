import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import AuthProvider from './contexts/AuthProvider';
import ThemeProvider from './contexts/ThemeProvider';
import LanguageProvider from './contexts/LanguageProvider';
import { createQueryClient } from './lib/queryClient';
import './index.css';

const queryClient = createQueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ThemeProvider>
            <LanguageProvider>
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>
                        <BrowserRouter>
                            <App />
                        </BrowserRouter>
                    </AuthProvider>
                </QueryClientProvider>
            </LanguageProvider>
        </ThemeProvider>
    </React.StrictMode>,
);
