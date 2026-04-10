import { Download } from 'lucide-react';
import { AppRecord } from '../types';

interface AppCardProps {
  app: AppRecord;
}

export function AppCard({ app }: AppCardProps) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:bg-white/10">
      <div className="flex items-start gap-4">
        <img
          src={app.image_url}
          alt={app.title}
          className="h-20 w-20 rounded-2xl object-cover shadow-lg"
          referrerPolicy="no-referrer"
        />
        <div className="flex-1">
          <h3 className="font-serif text-2xl font-semibold tracking-tight text-white">
            {app.title}
          </h3>
          <p className="mt-2 text-sm text-white/60 line-clamp-3 leading-relaxed">
            {app.description}
          </p>
        </div>
      </div>
      
      <div className="mt-6 mt-auto pt-6">
        <a
          href={app.apk_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-transparent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white hover:text-black"
        >
          <Download className="h-4 w-4" />
          Download APK
        </a>
      </div>
    </div>
  );
}
