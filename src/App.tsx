import { useEffect, useState } from 'react';
import { AppCard } from './components/AppCard';
import { AdminPanel } from './components/AdminPanel';
import { AppRecord } from './types';
import { Settings, LayoutGrid, AlertCircle } from 'lucide-react';
import { supabase, hasSupabaseConfig } from './supabase';

export default function App() {
  const [apps, setApps] = useState<AppRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'public' | 'admin'>('public');
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    if (clickCount > 0) {
      const timer = setTimeout(() => setClickCount(0), 1500);
      return () => clearTimeout(timer);
    }
  }, [clickCount]);

  const handleSecretClick = () => {
    const newCount = clickCount + 1;
    if (newCount >= 5) {
      setView('admin');
      setClickCount(0);
    } else {
      setClickCount(newCount);
    }
  };

  const fetchApps = async () => {
    if (!hasSupabaseConfig) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('apps')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setApps(data || []);
    } catch (error) {
      console.error('Failed to fetch apps:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  if (!hasSupabaseConfig) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="mb-4 font-serif text-2xl text-white">Setup Required</h2>
          <p className="text-white/60 mb-6 leading-relaxed">
            Please add your Supabase keys to your environment variables to continue.
          </p>
          <div className="text-left bg-black/50 p-4 rounded-lg text-sm font-mono text-white/80 overflow-x-auto whitespace-nowrap border border-white/10">
            VITE_SUPABASE_URL=...<br/>
            VITE_SUPABASE_ANON_KEY=...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050505]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div 
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={handleSecretClick}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <h1 className="font-serif text-xl font-medium tracking-wide">
              APK Vault
            </h1>
          </div>
          
          <nav className="flex items-center gap-2">
            <button
              onClick={() => setView('public')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                view === 'public' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
              }`}
            >
              Gallery
            </button>
            {view === 'admin' && (
              <button
                onClick={() => setView('admin')}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  view === 'admin' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                }`}
              >
                <Settings className="h-4 w-4" />
                Admin
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        {view === 'public' ? (
          <div className="space-y-12">
            <div className="max-w-2xl">
              <h2 className="font-serif text-5xl font-light tracking-tight sm:text-6xl">
                My Android Creations
              </h2>
              <p className="mt-6 text-lg text-white/60 leading-relaxed">
                Welcome to my personal showcase of custom Android applications. Explore the projects I've designed and developed, discover their features, and download the APKs directly to your device.
              </p>
            </div>

            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
              </div>
            ) : apps.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 py-32 text-center">
                <LayoutGrid className="mb-4 h-12 w-12 text-white/20" />
                <h3 className="font-serif text-2xl text-white">No apps yet</h3>
                <p className="mt-2 text-white/50">Check back later for new releases.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {apps.map((app) => (
                  <AppCard key={app.id} app={app} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mx-auto max-w-3xl">
            <AdminPanel 
              apps={apps} 
              onAppAdded={fetchApps} 
              onAppDeleted={fetchApps} 
            />
          </div>
        )}
      </main>
    </div>
  );
}
