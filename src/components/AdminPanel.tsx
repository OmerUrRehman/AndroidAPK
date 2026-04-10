import { useState } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { AppRecord } from '../types';

interface AdminPanelProps {
  apps: AppRecord[];
  onAppAdded: () => void;
  onAppDeleted: () => void;
}

export function AdminPanel({ apps, onAppAdded, onAppDeleted }: AdminPanelProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [apkFile, setApkFile] = useState<File | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !imageFile || !apkFile) {
      setError('All fields are required');
      return;
    }

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('image', imageFile);
    formData.append('apk', apkFile);

    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed.');
      }

      setTitle('');
      setDescription('');
      setImageFile(null);
      setApkFile(null);
      onAppAdded();
      
      // Reset file inputs
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
      const res = await fetch(`/api/apps/${app.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Delete failed.');
      }

      onAppDeleted();
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete app');
    }
  };

  return (
    <div className="space-y-12">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-serif text-2xl text-white">Upload New App</h2>
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
