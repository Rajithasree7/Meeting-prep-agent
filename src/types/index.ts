export interface Contact {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  company: string | null;
  role: string | null;
  relationship_type: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  user_id: string;
  contact_id: string;
  title: string;
  meeting_date: string;
  duration_minutes: number;
  raw_notes: string | null;
  summary: string | null;
  topics: string[];
  decisions: string[];
  user_commitments: string[];
  contact_commitments: string[];
  deadlines: Deadline[];
  follow_ups: string[];
  open_questions: string[];
  important_facts: string[];
  extraction_status: string;
  created_at: string;
  updated_at: string;
  contact?: Contact;
}

export interface Deadline {
  description: string;
  date: string;
  owner?: string;
}

export interface Commitment {
  id: string;
  user_id: string;
  contact_id: string;
  meeting_id: string | null;
  description: string;
  owner: 'user' | 'contact';
  status: 'open' | 'completed' | 'overdue';
  due_date: string | null;
  completed_at: string | null;
  source: string;
  created_at: string;
  updated_at: string;
  contact?: Contact;
  meeting?: Meeting;
}

export interface MemoryFeedback {
  id: string;
  user_id: string;
  contact_id: string | null;
  briefing: Briefing | null;
  rating: 'very_useful' | 'useful' | 'not_useful';
  improvement_suggestion: string | null;
  created_at: string;
}

export interface UserPreference {
  id: string;
  user_id: string;
  preference_key: string;
  preference_value: string;
  source: string;
  created_at: string;
}

export interface Briefing {
  relationshipContext: string;
  recentDiscussions: string[];
  importantDecisions: string[];
  yourCommitments: string[];
  theirCommitments: string[];
  missedFollowUps: string[];
  openQuestions: string[];
  suggestedTalkingPoints: string[];
  suggestedAgenda: string[];
  memoryInsights: string[];
  metadata?: {
    memoriesRecalled: number;
    preferencesApplied: number;
    source: 'hindsight' | 'fallback';
  };
}

export interface HealthStatus {
  database: 'connected' | 'disconnected';
  hindsight: 'connected' | 'not_configured' | 'disconnected';
  ai: 'configured' | 'not_configured';
}
