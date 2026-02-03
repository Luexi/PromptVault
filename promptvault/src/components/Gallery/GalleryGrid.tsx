import { Loader2, Image as ImageIcon } from 'lucide-react';
import { PromptCard } from './PromptCard';
import { FilterTabs } from './FilterTabs';
import type { Prompt } from '../../types';

interface GalleryGridProps {
  prompts: Prompt[];
  loading: boolean;
  selectedPrompt: Prompt | null;
  filter: string | null;
  onFilterChange: (filter: string | null) => void;
  onSelectPrompt: (prompt: Prompt) => void;
  onToggleFavorite: (id: number) => void;
}

export function GalleryGrid({
  prompts,
  loading,
  selectedPrompt,
  filter,
  onFilterChange,
  onSelectPrompt,
  onToggleFavorite,
}: GalleryGridProps) {
  return (
    <div className="flex flex-col h-full bg-bg-primary">
      <FilterTabs currentFilter={filter} onFilterChange={onFilterChange} />
      
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
          </div>
        ) : prompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary">
            <ImageIcon className="w-16 h-16 mb-4 text-text-muted" />
            <p className="text-lg font-medium">No prompts found</p>
            <p className="text-sm mt-1">Create your first prompt to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                isSelected={selectedPrompt?.id === prompt.id}
                onClick={() => onSelectPrompt(prompt)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
