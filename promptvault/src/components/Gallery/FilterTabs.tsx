import { Image, Sparkles, Palette, Zap, Bot, Sun, Flame } from 'lucide-react';

interface FilterTabsProps {
  currentFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

const filters = [
  { id: null, label: 'All', icon: Image },
  { id: 'Gemini', label: 'Gemini', icon: Sparkles },
  { id: 'Chat GPT', label: 'Chat GPT', icon: Bot },
  { id: 'Midjourney V6', label: 'Midjourney', icon: Sparkles },
  { id: 'DALL-E 3', label: 'DALL-E 3', icon: Palette },
  { id: 'Stable Diffusion XL', label: 'Stable Diffusion', icon: Zap },
  { id: 'Flux Pro', label: 'Flux', icon: Bot },
  { id: 'Leonardo AI', label: 'Leonardo', icon: Sun },
  { id: 'Firefly', label: 'Firefly', icon: Flame },
];

export function FilterTabs({ currentFilter, onFilterChange }: FilterTabsProps) {
  return (
    <div className="flex items-center gap-1 px-6 py-3 border-b border-border-subtle bg-bg-primary overflow-x-auto">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = currentFilter === filter.id;
        
        return (
          <button
            key={filter.label}
            onClick={() => onFilterChange(filter.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              isActive
                ? 'bg-accent-blue text-white shadow-soft'
                : 'bg-white text-text-secondary hover:bg-white/80 border border-border-subtle'
            }`}
          >
            <Icon className="w-4 h-4" />
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
