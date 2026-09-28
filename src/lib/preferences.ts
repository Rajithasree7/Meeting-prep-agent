import { supabase } from './supabase';
import type { UserPreference, MemoryFeedback } from '@/types';

export async function fetchPreferences(): Promise<UserPreference[]> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchFeedbackHistory(): Promise<MemoryFeedback[]> {
  const { data, error } = await supabase
    .from('memory_feedback')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
