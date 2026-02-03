import { Search, Plus } from 'lucide-react';

interface HeaderProps {
  title: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNewPrompt: () => void;
}

export function Header({ title, searchQuery, onSearchChange, onNewPrompt }: HeaderProps) {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border-subtle bg-bg-primary">
      <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
      
      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-64 pl-10 pr-4 py-2 bg-white border border-border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all"
          />
        </div>

        {/* New Prompt Button */}
        <button
          onClick={onNewPrompt}
          className="flex items-center gap-2 px-4 py-2 bg-accent-blue hover:bg-accent-blue-hover text-white rounded-xl text-sm font-medium transition-colors duration-200 shadow-soft"
        >
          <Plus className="w-4 h-4" />
          New Prompt
        </button>
      </div>
    </header>
  );
}
