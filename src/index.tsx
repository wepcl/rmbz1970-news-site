import React from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RotateCcw } from 'lucide-react';

import RoutesComponent from './app.tsx';
import { Toaster } from '@/components/ui/sonner';
import './index.css';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f8faff] p-6 text-center">
      <AlertTriangle className="h-12 w-12 text-[#d63838]" />
      <div>
        <h1 className="text-xl font-bold text-[#1a2540]">页面出了点问题</h1>
        <p className="mt-2 text-sm text-[#5a6b85]">{error?.message || '未知错误'}</p>
      </div>
      <button className="retro-btn" onClick={resetErrorBoundary}>
        <RotateCcw className="h-4 w-4" />
        重新加载
      </button>
    </div>
  );
}

const MainApp = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary fallbackRender={({ error, resetErrorBoundary }) => (
        <ErrorFallback error={error as Error} resetErrorBoundary={resetErrorBoundary} />
      )}>
        <RoutesComponent />
        {createPortal(<Toaster />, document.body)}
      </ErrorBoundary>
    </BrowserRouter>
  );
};

createRoot(document.getElementById('root')!).render(<MainApp />);
