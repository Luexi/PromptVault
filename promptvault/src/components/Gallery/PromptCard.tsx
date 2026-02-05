import { useEffect, useState } from 'react';
import { Heart, Image as ImageIcon } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import type { Prompt } from '../../types';

interface PromptCardProps {
  prompt: Prompt;
  isSelected: boolean;
  onClick: () => void;
  onToggleFavorite: (id: number) => void;
}

export function PromptCard({ prompt, isSelected, onClick, onToggleFavorite }: PromptCardProps) {
  const [imageError, setImageError] = useState(false);
  const [thumbnailSrc, setThumbnailSrc] = useState<string | null>(null);

  const modelColors: Record<string, string> = {
    'Stable Diffusion XL': '#8B5CF6',
    'Midjourney V6': '#10B981',
    'DALL-E 3': '#F59E0B',
    'Gemini': '#22C55E',
    'Chat GPT': '#0EA5E9',
    'Flux Pro': '#3B82F6',
    'Flux.1': '#6366F1',
    'Leonardo AI': '#EC4899',
    'Firefly': '#EF4444',
  };

  const modelColor = modelColors[prompt.model] || '#6B7280';

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  useEffect(() => {
    let isActive = true;
    const loadThumbnail = async () => {
      setImageError(false);
      if (!prompt.thumbnail_path) {
        setThumbnailSrc(null);
        return;
      }
      if (prompt.thumbnail_path.startsWith('data:')) {
        setThumbnailSrc(prompt.thumbnail_path);
        return;
      }
      try {
        const base64 = await invoke<string>('get_image_base64', { path: prompt.thumbnail_path });
        const ext = prompt.thumbnail_path.split('.').pop()?.toLowerCase();
        const mime =
          ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
          ext === 'webp' ? 'image/webp' :
          ext === 'gif' ? 'image/gif' :
          ext === 'svg' ? 'image/svg+xml' :
          'image/png';
        if (isActive) {
          setThumbnailSrc(`data:${mime};base64,${base64}`);
        }
      } catch (error) {
        if (isActive) {
          setImageError(true);
        }
      }
    };

    void loadThumbnail();
    return () => {
      isActive = false;
    };
  }, [prompt.thumbnail_path]);

  return (
    <div
      onClick={onClick}
      className={`group relative bg-bg-surface rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'ring-2 ring-accent-blue shadow-floating'
          : 'hover:shadow-floating border border-border-subtle'
      }`}
    >
      {/* Image Container */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {thumbnailSrc && !imageError ? (
          <img
            src={thumbnailSrc}
            alt={prompt.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <ImageIcon className="w-12 h-12 text-gray-300" />
          </div>
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
        
        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(prompt.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 ${
            prompt.is_favorite
              ? 'bg-white text-red-500 shadow-soft'
              : 'bg-white/80 text-text-muted opacity-0 group-hover:opacity-100 hover:bg-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${prompt.is_favorite ? 'fill-current' : ''}`} />
        </button>

        {/* Model Badge */}
        <div
          className="absolute bottom-3 left-3 px-2 py-1 rounded-lg text-xs font-medium text-white shadow-soft"
          style={{ backgroundColor: modelColor }}
        >
          {prompt.model}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-text-primary text-sm mb-1 truncate">
          {prompt.title}
        </h3>
        <p className="text-xs text-text-secondary line-clamp-2">
          {truncateText(prompt.prompt_text, 80)}
        </p>
        
        {prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {prompt.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-badge-bg border border-badge-border rounded-md text-xs text-text-secondary"
              >
                {tag}
              </span>
            ))}
            {prompt.tags.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-text-muted">
                +{prompt.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
