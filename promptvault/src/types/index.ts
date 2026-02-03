export interface Prompt {
  id: number;
  title: string;
  prompt_text: string;
  negative_prompt: string;
  model: string;
  image_path: string | null;
  thumbnail_path: string | null;
  dimensions: string;
  steps: number | null;
  sampler: string | null;
  cfg_scale: number | null;
  seed: string | null;
  tags: string[];
  is_favorite: boolean;
  collection_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface NewPrompt {
  title: string;
  prompt_text: string;
  negative_prompt?: string;
  model: string;
  dimensions?: string;
  steps?: number;
  sampler?: string;
  cfg_scale?: number;
  seed?: string;
  tags?: string[];
  collection_id?: number;
}

export interface UpdatePrompt {
  title?: string;
  prompt_text?: string;
  negative_prompt?: string;
  model?: string;
  dimensions?: string;
  steps?: number;
  sampler?: string;
  cfg_scale?: number;
  seed?: string;
  tags?: string[];
  is_favorite?: boolean;
  collection_id?: number;
}

export interface Collection {
  id: number;
  name: string;
  icon: string;
  color: string;
  prompt_count?: number;
}

export interface Model {
  id: number;
  name: string;
  short_name: string;
  is_active: boolean;
}

export type ViewMode = 'gallery' | 'detail';
export type SidebarSection = 'all' | 'favorites' | 'history' | 'collection';
