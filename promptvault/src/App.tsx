import { useState, useEffect } from 'react'
import { Sidebar } from './components/Layout/Sidebar'
import { Header } from './components/Layout/Header'
import { GalleryGrid } from './components/Gallery/GalleryGrid'
import { InspectorPanel } from './components/Inspector/InspectorPanel'
import { NewPromptModal } from './components/Modals/NewPromptModal'
import { usePrompts } from './hooks/usePrompts'
import { useCollections } from './hooks/useCollections'
import type { Prompt, SidebarSection } from './types'

function App() {
  const [selectedSection, setSelectedSection] = useState<SidebarSection>('all')
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null)
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { prompts, loading, filter, setFilter, fetchPrompts, createPrompt, deletePrompt, toggleFavorite } = usePrompts()
  const { collections, createCollection } = useCollections()

  useEffect(() => {
    fetchPrompts(filter || undefined, selectedCollectionId || undefined)
  }, [filter, selectedCollectionId])

  const filteredPrompts = prompts.filter(prompt => {
    if (selectedSection === 'favorites' && !prompt.is_favorite) return false
    if (selectedSection === 'collection' && selectedCollectionId && prompt.collection_id !== selectedCollectionId) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        prompt.title.toLowerCase().includes(query) ||
        prompt.prompt_text.toLowerCase().includes(query) ||
        prompt.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }
    return true
  })

  const handleSectionChange = (section: SidebarSection, collectionId?: number) => {
    setSelectedSection(section)
    setSelectedCollectionId(collectionId || null)
    setSelectedPrompt(null)
  }

  const handleFilterChange = (modelFilter: string | null) => {
    setFilter(modelFilter)
  }

  return (
    <div className="flex h-screen w-screen bg-bg-primary overflow-hidden">
      <Sidebar
        selectedSection={selectedSection}
        selectedCollectionId={selectedCollectionId}
        collections={collections}
        onSectionChange={handleSectionChange}
        onCreateCollection={createCollection}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={selectedSection === 'collection' && selectedCollectionId
            ? collections.find(c => c.id === selectedCollectionId)?.name || 'Collection'
            : selectedSection === 'favorites'
            ? 'Favorites'
            : 'Gallery'}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNewPrompt={() => setIsModalOpen(true)}
        />
        
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <GalleryGrid
              prompts={filteredPrompts}
              loading={loading}
              selectedPrompt={selectedPrompt}
              filter={filter}
              onFilterChange={handleFilterChange}
              onSelectPrompt={setSelectedPrompt}
              onToggleFavorite={toggleFavorite}
            />
          </div>
          
          {selectedPrompt && (
            <InspectorPanel
              prompt={selectedPrompt}
              onClose={() => setSelectedPrompt(null)}
              onDelete={async (id) => {
                await deletePrompt(id)
                setSelectedPrompt(null)
              }}
            />
          )}
        </div>
      </div>

      {isModalOpen && (
        <NewPromptModal
          collections={collections}
          onClose={() => setIsModalOpen(false)}
          onSave={async (data) => {
            await createPrompt(data)
            setIsModalOpen(false)
          }}
        />
      )}
    </div>
  )
}

export default App
