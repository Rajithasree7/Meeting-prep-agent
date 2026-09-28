import { supabase } from './supabase';
import type { Commitment } from '@/types';

export async function fetchCommitments(filterStatus?: string): Promise<Commitment[]> {
  let query = supabase
    .from('commitments')
    .select('*, contact:contacts(*), meeting:meetings(*)')
    .order('due_date', { ascending: true, nullsFirst: false });

  if (filterStatus && filterStatus !== 'all') {
    query = query.eq('status', filterStatus);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchCommitmentsByContact(contactId: string): Promise<Commitment[]> {
  const { data, error } = await supabase
    .from('commitments')
    .select('*')
    .eq('contact_id', contactId)
    .order('due_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function createCommitment(input: {
  contact_id: string;
  description: string;
  owner: 'user' | 'contact';
  due_date?: string | null;
  meeting_id?: string | null;
}): Promise<Commitment> {
  const { data, error } = await supabase
    .from('commitments')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCommitment(
  id: string,
  input: Partial<Commitment>
): Promise<Commitment> {
  const { data, error } = await supabase
    .from('commitments')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCommitment(id: string): Promise<void> {
  const { error } = await supabase.from('commitments').delete().eq('id', id);
  if (error) throw error;
}
