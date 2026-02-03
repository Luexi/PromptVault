import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { Collection } from '../types';

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCollections = useCallback(async () => {
    try {
      setLoading(true);
      const result = await invoke<Collection[]>('get_collections');
      setCollections(result);
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCollection = useCallback(async (name: string) => {
    try {
      const result = await invoke<Collection>('create_collection', { name });
      setCollections(prev => [...prev, result]);
      return result;
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return {
    collections,
    loading,
    fetchCollections,
    createCollection,
  };
}
