import { supabase } from './supabase';
import type { Briefing, HealthStatus } from '@/types';

const EDGE_FUNCTION_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.session?.access_token ?? ''}`,
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
}

export async function callEdgeFunction<T>(
  name: string,
  body: Record<string, unknown>,
  method: 'POST' | 'GET' = 'POST'
): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${EDGE_FUNCTION_BASE}/${name}`, {
    method,
    headers,
    body: method === 'POST' ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `Request failed (${response.status})`);
  }

  return response.json();
}

export async function extractMeeting(
  meetingId: string,
  notes: string,
  contactName: string
): Promise<{ extraction: Record<string, unknown> }> {
  return callEdgeFunction('extract-meeting', { meetingId, notes, contactName });
}

export async function prepareMeeting(
  contactId: string,
  contactName: string
): Promise<{ briefing: Briefing }> {
  return callEdgeFunction('prepare-meeting', { contactId, contactName });
}

export async function submitFeedback(
  contactId: string,
  briefing: Briefing,
  rating: string,
  improvementSuggestion?: string
): Promise<{ success: boolean }> {
  return callEdgeFunction('memory-feedback', {
    contactId,
    briefing,
    rating,
    improvementSuggestion,
  });
}

export async function getHealthStatus(): Promise<HealthStatus> {
  return callEdgeFunction<HealthStatus>('health-check', {}, 'GET');
}
