import { useState } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { AppRecord } from '../types';
import { supabase } from '../supabase';

interface AdminPanelProps {
  apps: AppRecord[];
  onAppAdded: () => void;
  onAppDeleted: () => void;
}

export function AdminPanel({ apps, onAppAdded, onAppDeleted }: AdminPanelProps) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [apkFile, setApkFile] = useState<File | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !imageFile || !apkFile) {
      setError('All fields are required');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // Upload Image to Supabase Storage
      const imageExt = imageFile.name.split('.').pop();
      const imagePath = `images/${Date.now()}.${imageExt}`;
      const { error: imageError } = await supabase.storage.from('vault').upload(imagePath, imageFile);
      if (imageError) throw imageError;
      const { data: imageData } = supabase.storage.from('vault').getPublicUrl(imagePath);

      // Upload APK to Supabase Storage
      const apkExt = apkFile.name.split('.').pop();
      const apkPath = `apks/${Date.now()}.${apkExt}`;
      const { error: apkError } = await supabase.storage.from('vault').upload(apkPath, apkFile);
      if (apkError) throw apkError;
      const { data: apkData } = supabase.storage.from('vault').getPublicUrl(apkPath);

      // Save to Supabase Database
      const { error: dbError } = await supabase.from('apps').insert([{
        title,
        description,
        image_url: imageData.publicUrl,
        apk_url: apkData.publicUrl
      }]);
      
      if (dbError) throw dbError;

      setTitle('');
      setDescription('');
      setImageFile(null);
      setApkFile(null);
      onAppAdded();
      
      const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
      fileInputs.forEach(input => input.value = '');
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload app');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (app: AppRecord) => {
    if (!confirm('Are you sure you want to delete this app?')) return;
    
    try {
      // Delete from Database
      const { error: dbError } = await supabase.from('apps').delete().eq('id', app.id);
      if (dbError) throw dbError;

      // Extract paths from URLs to delete from storage
      // URL format: .../storage/v1/object/public/vault/images/123.png
      const imagePath = app.image_url.split('/vault/')[1];
      const apkPath = app.apk_url.split('/vault/')[1];

      if (imagePath) await supabase.storage.from('vault').remove([imagePath]);
      if (apkPath) await supabase.storage.from('vault').remove([apkPath]);

      onAppDeleted();
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete app');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-8">
        <h2 className="mb-6 font-serif text-2xl text-white">Admin Access</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Enter Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-transparent px-4 py-3 text-white placeholder:text-white/40 focus:border-white focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-full bg-white px-4 py-3 font-medium text-black transition-opacity hover:opacity-90"
          >
            Authenticate
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-serif text-2xl text-white">Upload New App</h2>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-sm text-white/60 hover:text-white"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-white/60">App Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-transparent px-4 py-3 text-white focus:border-white focus:outline-none"
                placeholder="e.g. My Awesome Game"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-white/60">App Icon / Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full rounded-lg border border-white/20 bg-transparent px-4 py-2.5 text-white file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-1 file:text-sm file:text-white hover:file:bg-white/20 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-white/60">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-white/20 bg-transparent px-4 py-3 text-white focus:border-white focus:outline-none"
              placeholder="Describe your app..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-white/60">APK File</label>
            <input
              type="file"
              accept=".apk"
              onChange={(e) => setApkFile(e.target.files?.[0] || null)}
              className="w-full rounded-lg border border-white/20 bg-transparent px-4 py-2.5 text-white file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-1 file:text-sm file:text-white hover:file:bg-white/20 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isUploading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-4 font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isUploading ? (
              'Uploading...'
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Upload App
              </>
            )}
          </button>
        </form>
      </div>

      {apps.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-6 font-serif text-2xl text-white">Manage Apps</h2>
          <div className="space-y-4">
            {apps.map(app => (
              <div key={app.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-4">
                  <img src={app.image_url} alt={app.title} className="h-12 w-12 rounded-lg object-cover" />
                  <div>
                    <h4 className="font-medium text-white">{app.title}</h4>
                    <p className="text-xs text-white/50">{new Date(app.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(app)}
                  className="rounded-full p-2 text-red-400 transition-colors hover:bg-red-500/20"
                  title="Delete App"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
