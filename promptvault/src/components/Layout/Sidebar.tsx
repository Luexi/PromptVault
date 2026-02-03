import { Folder, Heart, Clock, Settings, User, Plus, Image } from 'lucide-react';
import type { Collection, SidebarSection } from '../../types';

interface SidebarProps {
  selectedSection: SidebarSection;
  selectedCollectionId: number | null;
  collections: Collection[];
  onSectionChange: (section: SidebarSection, collectionId?: number) => void;
  onCreateCollection: (name: string) => void;
}

export function Sidebar({
  selectedSection,
  selectedCollectionId,
  collections,
  onSectionChange,
}: SidebarProps) {
  const libraryItems = [
    { id: 'all' as SidebarSection, label: 'All Prompts', icon: Image },
    { id: 'favorites' as SidebarSection, label: 'Favorites', icon: Heart },
    { id: 'history' as SidebarSection, label: 'History', icon: Clock },
  ];

  const isLibraryActive = (id: SidebarSection) => 
    selectedSection === id && selectedCollectionId === null;

  const isCollectionActive = (id: number) => 
    selectedSection === 'collection' && selectedCollectionId === id;

  return (
    <aside className="w-[220px] flex-shrink-0 bg-bg-sidebar border-r border-border-subtle flex flex-col">
      {/* Traffic Lights */}
      <div className="h-12 flex items-center px-4 gap-2">
        <div className="w-3 h-3 rounded-full bg-traffic-red" />
        <div className="w-3 h-3 rounded-full bg-traffic-yellow" />
        <div className="w-3 h-3 rounded-full bg-traffic-green" />
      </div>

      {/* Library Section */}
      <div className="px-3 py-2">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider px-3 mb-2">
          Library
        </h3>
        <nav className="space-y-1">
          {libraryItems.map((item) => {
            const Icon = item.icon;
            const isActive = isLibraryActive(item.id);
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? 'bg-white shadow-soft text-text-primary'
                    : 'text-text-secondary hover:bg-white/50 hover:text-text-primary'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Collections Section */}
      <div className="px-3 py-2 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-3 mb-2">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Collections
          </h3>
          <button className="p-1 rounded-md hover:bg-white/50 text-text-muted hover:text-text-primary transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <nav className="space-y-1">
          {collections.map((collection) => (
            <button
              key={collection.id}
              onClick={() => onSectionChange('collection', collection.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                isCollectionActive(collection.id)
                  ? 'bg-white shadow-soft text-text-primary'
                  : 'text-text-secondary hover:bg-white/50 hover:text-text-primary'
              }`}
            >
              <Folder className="w-4 h-4" style={{ color: collection.color }} />
              <span className="truncate">{collection.name}</span>
              {collection.prompt_count !== undefined && (
                <span className="ml-auto text-xs text-text-muted">
                  {collection.prompt_count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border-subtle">
        <nav className="space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-white/50 hover:text-text-primary transition-colors duration-200">
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-white/50 hover:text-text-primary transition-colors duration-200">
            <User className="w-4 h-4" />
            User
          </button>
        </nav>
      </div>
    </aside>
  );
}
