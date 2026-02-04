import { useState, useCallback } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import type { Collection, NewPrompt } from '../../types';

interface NewPromptModalProps {
  collections: Collection[];
  onClose: () => void;
  onSave: (data: NewPrompt & { image_data?: number[]; filename?: string; image_path?: string; image_base64?: string }) => void;
}

export function NewPromptModal({ collections, onClose, onSave }: NewPromptModalProps) {
  const [formData, setFormData] = useState<NewPrompt>({
    title: '',
    prompt_text: '',
    negative_prompt: '',
    model: 'Stable Diffusion XL',
    dimensions: '1:1',
    tags: [],
    collection_id: undefined,
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageData, setImageData] = useState<number[] | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [imageFilename, setImageFilename] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  }, []);

  const handleImageFile = (file: File) => {
    const filePath = (file as File & { path?: string }).path;
    setImagePath(filePath || null);
    setImageFilename(file.name || null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    const arrayReader = new FileReader();
    arrayReader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      setImageData(Array.from(new Uint8Array(arrayBuffer)));
    };
    arrayReader.readAsArrayBuffer(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      setSaveError(null);
      await onSave({
        ...formData,
        image_data: imageData || undefined,
        filename: imageFilename || undefined,
        image_path: imagePath || undefined,
        image_base64: previewImage || undefined,
      });
    } catch (error) {
      if (typeof error === 'string') {
        setSaveError(error);
      } else if (error instanceof Error) {
        setSaveError(error.message || 'No se pudo guardar el prompt. Intenta nuevamente.');
      } else {
        setSaveError('No se pudo guardar el prompt. Intenta nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || [],
    }));
  };

  const models = [
    'Gemini',
    'Chat GPT',
    'Stable Diffusion XL',
    'Midjourney V6',
    'DALL-E 3',
    'Flux Pro',
    'Flux.1',
    'Leonardo AI',
    'Firefly',
  ];

  const dimensions = ['1:1', '16:9', '9:16', '4:3', '3:4', '2:3', '3:2'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-[900px] max-h-[90vh] bg-bg-surface rounded-2xl shadow-sheet overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2 className="text-lg font-semibold text-text-primary">New Prompt</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg-primary text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex">
          {/* Left Side - Image Drop */}
          <div className="w-[400px] p-6 border-r border-border-subtle">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`h-full min-h-[400px] rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center ${
                isDragging
                  ? 'border-accent-blue bg-accent-blue/5'
                  : previewImage
                  ? 'border-transparent'
                  : 'border-border-subtle hover:border-text-muted bg-bg-primary'
              }`}
            >
              {previewImage ? (
                <div className="relative w-full h-full">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-full object-contain rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewImage(null);
                      setImageData(null);
                      setImagePath(null);
                      setImageFilename(null);
                    }}
                    className="absolute top-2 right-2 p-2 bg-white rounded-lg shadow-soft hover:bg-red-50 text-text-secondary hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center cursor-pointer p-8">
                  <div className="w-16 h-16 rounded-2xl bg-bg-primary border border-border-subtle flex items-center justify-center mb-4">
                    <Upload className="w-6 h-6 text-text-muted" />
                  </div>
                  <p className="text-sm font-medium text-text-primary mb-1">
                    Drop image here
                  </p>
                  <p className="text-xs text-text-muted mb-4">
                    or click to browse
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-bg-primary border border-border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all"
                  placeholder="Enter prompt title"
                />
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Model *
                </label>
                <select
                  required
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-bg-primary border border-border-subtle rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all appearance-none cursor-pointer"
                >
                  {models.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>

              {/* Positive Prompt */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Positive Prompt *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.prompt_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, prompt_text: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-bg-primary border border-border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all resize-none"
                  placeholder="Enter your prompt..."
                />
              </div>

              {/* Negative Prompt */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Negative Prompt
                </label>
                <textarea
                  rows={3}
                  value={formData.negative_prompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, negative_prompt: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-bg-primary border border-border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all resize-none"
                  placeholder="Enter negative prompt (optional)..."
                />
              </div>

              {/* Dimensions */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Dimensions
                </label>
                <select
                  value={formData.dimensions}
                  onChange={(e) => setFormData(prev => ({ ...prev, dimensions: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-bg-primary border border-border-subtle rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all appearance-none cursor-pointer"
                >
                  {dimensions.map(dim => (
                    <option key={dim} value={dim}>{dim}</option>
                  ))}
                </select>
              </div>

              {/* Collection */}
              {collections.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Collection
                  </label>
                  <select
                    value={formData.collection_id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, collection_id: e.target.value ? parseInt(e.target.value) : undefined }))}
                    className="w-full px-4 py-2.5 bg-bg-primary border border-border-subtle rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all appearance-none cursor-pointer"
                  >
                    <option value="">None</option>
                    {collections.map(collection => (
                      <option key={collection.id} value={collection.id}>{collection.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 px-4 py-2.5 bg-bg-primary border border-border-subtle rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all"
                    placeholder="Add a tag..."
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2.5 bg-bg-primary border border-border-subtle rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:border-text-muted transition-all"
                  >
                    Add
                  </button>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-badge-bg border border-badge-border rounded-lg text-xs text-text-secondary"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-subtle bg-bg-primary">
          {saveError && (
            <p className="text-sm text-red-600 mr-auto">
              {saveError}
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !formData.title || !formData.prompt_text}
            className="px-6 py-2.5 bg-accent-blue hover:bg-accent-blue-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Prompt
          </button>
        </div>
      </div>
    </div>
  );
}
