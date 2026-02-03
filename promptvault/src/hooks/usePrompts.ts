import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { Prompt, NewPrompt, UpdatePrompt } from '../types';

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  const fetchPrompts = useCallback(async (modelFilter?: string, collectionId?: number) => {
    try {
      setLoading(true);
      const result = await invoke<Prompt[]>('get_all_prompts', {
        filter: modelFilter || null,
        collection_id: collectionId || null,
      });
      setPrompts(result);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPromptById = useCallback(async (id: number) => {
    try {
      return await invoke<Prompt>('get_prompt_by_id', { id });
    } catch (error) {
      console.error('Error fetching prompt:', error);
      return null;
    }
  }, []);

  const createPrompt = useCallback(async (data: NewPrompt & { image_data?: number[]; filename?: string }) => {
    try {
      const result = await invoke<Prompt>('create_prompt', {
        prompt: {
          title: data.title,
          prompt_text: data.prompt_text,
          negative_prompt: data.negative_prompt || '',
          model: data.model,
          dimensions: data.dimensions || '1:1',
          steps: data.steps,
          sampler: data.sampler,
          cfg_scale: data.cfg_scale,
          seed: data.seed,
          tags: data.tags || [],
          collection_id: data.collection_id,
        },
        image_data: data.image_data || null,
        filename: data.filename || null,
      });
      setPrompts(prev => [result, ...prev]);
      return result;
    } catch (error) {
      console.error('Error creating prompt:', error);
      throw error;
    }
  }, []);

  const updatePrompt = useCallback(async (id: number, data: UpdatePrompt) => {
    try {
      const result = await invoke<Prompt>('update_prompt', { id, prompt: data });
      setPrompts(prev => prev.map(p => p.id === id ? result : p));
      return result;
    } catch (error) {
      console.error('Error updating prompt:', error);
      throw error;
    }
  }, []);

  const deletePrompt = useCallback(async (id: number) => {
    try {
      await invoke('delete_prompt', { id });
      setPrompts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting prompt:', error);
      throw error;
    }
  }, []);

  const toggleFavorite = useCallback(async (id: number) => {
    try {
      const result = await invoke<boolean>('toggle_favorite', { id });
      setPrompts(prev => prev.map(p => 
        p.id === id ? { ...p, is_favorite: result } : p
      ));
      return result;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }, []);

  const searchPrompts = useCallback(async (query: string) => {
    try {
      setLoading(true);
      const result = await invoke<Prompt[]>('search_prompts', { query });
      setPrompts(result);
    } catch (error) {
      console.error('Error searching prompts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    prompts,
    loading,
    filter,
    setFilter,
    fetchPrompts,
    getPromptById,
    createPrompt,
    updatePrompt,
    deletePrompt,
    toggleFavorite,
    searchPrompts,
  };
}
