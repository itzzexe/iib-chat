import React from 'react';
import { Link } from 'lucide-react';
import { LinkPreviewData } from '../../types';

interface LinkPreviewCardProps {
  data: LinkPreviewData;
}

export default function LinkPreviewCard({ data }: LinkPreviewCardProps) {
  if (!data || !data.success || !data.ogTitle) {
    return null;
  }

  const imageUrl = data.ogImage?.[0]?.url;

  return (
    <a
      href={data.ogUrl || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 block max-w-sm rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={data.ogTitle}
          className="w-full h-32 rounded-t-lg object-cover"
        />
      )}
      <div className="p-3">
        <p className="text-sm font-bold text-secondary-900 dark:text-white truncate">
          {data.ogTitle}
        </p>
        {data.ogDescription && (
          <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1 line-clamp-2">
            {data.ogDescription}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2 text-xs text-secondary-500 dark:text-secondary-400">
          <Link className="w-3 h-3" />
          <span className="truncate">{data.ogUrl}</span>
        </div>
      </div>
    </a>
  );
} 