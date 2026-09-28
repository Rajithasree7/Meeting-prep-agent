import { supabase } from './supabase';
import type { Meeting } from '@/types';

export async function fetchMeetings(): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from('meetings')
    .select('*, contact:contacts(*)')
    .order('meeting_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchMeetingsByContact(contactId: string): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('contact_id', contactId)
    .order('meeting_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchMeeting(id: string): Promise<Meeting | null> {
  const { data, error } = await supabase
    .from('meetings')
    .select('*, contact:contacts(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createMeeting(input: {
  contact_id: string;
  title: string;
  meeting_date: string;
  duration_minutes?: number;
  raw_notes?: string;
}): Promise<Meeting> {
  const { data, error } = await supabase
    .from('meetings')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMeeting(id: string, input: Partial<Meeting>): Promise<Meeting> {
  const { data, error } = await supabase
    .from('meetings')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMeeting(id: string): Promise<void> {
  const { error } = await supabase.from('meetings').delete().eq('id', id);
  if (error) throw error;
}
