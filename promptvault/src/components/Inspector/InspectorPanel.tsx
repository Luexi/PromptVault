import { useEffect, useState } from 'react';
import { X, Copy, Download, Trash2, Image as ImageIcon, Check } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import type { Prompt } from '../../types';

interface InspectorPanelProps {
  prompt: Prompt;
  onClose: () => void;
  onDelete: (id: number) => void;
}

export function InspectorPanel({ prompt, onClose, onDelete }: InspectorPanelProps) {
  const [imageError, setImageError] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const handleCopy = async (text: string, field: string) => {
    try {
      await invoke('copy_to_clipboard', { text });
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleDownload = async () => {
    if (prompt.image_path) {
      try {
        await invoke('open_image_external', { path: prompt.image_path });
      } catch (error) {
        console.error('Error opening image:', error);
      }
    }
  };

  useEffect(() => {
    let isActive = true;
    const loadImage = async () => {
      setImageError(false);
      const path = prompt.image_path || prompt.thumbnail_path;
      if (!path) {
        setImageSrc(null);
        return;
      }
      if (path.startsWith('data:')) {
        setImageSrc(path);
        return;
      }
      try {
        const base64 = await invoke<string>('get_image_base64', { path });
        const ext = path.split('.').pop()?.toLowerCase();
        const mime =
          ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
          ext === 'webp' ? 'image/webp' :
          ext === 'gif' ? 'image/gif' :
          'image/png';
        if (isActive) {
          setImageSrc(`data:${mime};base64,${base64}`);
        }
      } catch (error) {
        if (isActive) {
          setImageError(true);
        }
      }
    };

    void loadImage();
    return () => {
      isActive = false;
    };
  }, [prompt.image_path, prompt.thumbnail_path]);

  return (
    <aside className="w-[360px] flex-shrink-0 bg-bg-surface border-l border-border-subtle flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-subtle">
        <h2 className="font-semibold text-text-primary">Prompt Details</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-bg-primary text-text-secondary hover:text-text-primary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Image */}
        <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
          {imageSrc && !imageError ? (
            <img
              src={imageSrc}
              alt={prompt.title}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <ImageIcon className="w-16 h-16 text-gray-300" />
            </div>
          )}
        </div>

        {/* Title & Actions */}
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-semibold text-lg text-text-primary leading-tight">
            {prompt.title}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleCopy(prompt.prompt_text, 'prompt')}
              className="p-2 rounded-lg hover:bg-bg-primary text-text-secondary hover:text-accent-blue transition-colors"
              title="Copy prompt"
            >
              {copiedField === 'prompt' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg hover:bg-bg-primary text-text-secondary hover:text-accent-blue transition-colors"
              title="Download image"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Prompt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Prompt
            </h4>
            <button
              onClick={() => handleCopy(prompt.prompt_text, 'prompt-full')}
              className="text-xs text-accent-blue hover:text-accent-blue-hover transition-colors"
            >
              {copiedField === 'prompt-full' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="p-3 bg-bg-primary rounded-xl border border-border-subtle">
            <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
              {prompt.prompt_text}
            </p>
          </div>
        </div>

        {/* Negative Prompt */}
        {prompt.negative_prompt && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Negative Prompt
              </h4>
              <button
                onClick={() => handleCopy(prompt.negative_prompt, 'negative')}
                className="text-xs text-accent-blue hover:text-accent-blue-hover transition-colors"
              >
                {copiedField === 'negative' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="p-3 bg-bg-primary rounded-xl border border-border-subtle">
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {prompt.negative_prompt}
              </p>
            </div>
          </div>
        )}

        {/* Generation Info */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Generation Info
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <InfoItem label="Model" value={prompt.model} />
            <InfoItem label="Dimensions" value={prompt.dimensions} />
            {prompt.steps && <InfoItem label="Steps" value={prompt.steps.toString()} />}
            {prompt.sampler && <InfoItem label="Sampler" value={prompt.sampler} />}
            {prompt.cfg_scale && <InfoItem label="CFG Scale" value={prompt.cfg_scale.toString()} />}
            {prompt.seed && <InfoItem label="Seed" value={prompt.seed} />}
          </div>
        </div>

        {/* Tags */}
        {prompt.tags.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {prompt.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 bg-badge-bg border border-badge-border rounded-lg text-xs text-text-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-border-subtle space-y-2">
        <button
          onClick={() => handleCopy(prompt.prompt_text, 'copy-action')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-blue hover:bg-accent-blue-hover text-white rounded-xl text-sm font-medium transition-colors"
        >
          {copiedField === 'copy-action' ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Prompt
            </>
          )}
        </button>
        <button
          onClick={() => {
            if (confirm('Are you sure you want to delete this prompt?')) {
              onDelete(prompt.id);
            }
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete Prompt
        </button>
      </div>
    </aside>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 bg-bg-primary rounded-lg border border-border-subtle">
      <p className="text-xs text-text-muted mb-0.5">{label}</p>
      <p className="text-sm font-medium text-text-primary truncate">{value}</p>
    </div>
  );
}
