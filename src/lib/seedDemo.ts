import { supabase } from './supabase';

interface SeedContact {
  name: string;
  email: string;
  company: string;
  role: string;
  relationship_type: string;
  notes: string;
}

interface SeedMeeting {
  title: string;
  meeting_date: string;
  duration_minutes: number;
  raw_notes: string;
}

interface SeedCommitment {
  description: string;
  owner: 'user' | 'contact';
  status: 'open' | 'completed';
  due_date: string | null;
}

const demoContacts: SeedContact[] = [
  {
    name: 'Rahul Sharma',
    email: 'rahul@acmetech.com',
    company: 'Acme Technologies',
    role: 'Backend Lead',
    relationship_type: 'Project Collaborator',
    notes: 'Key collaborator on the API integration project. Technical, detail-oriented, prefers structured discussions.',
  },
  {
    name: 'Priya Nair',
    email: 'priya@designstudio.io',
    company: 'Design Studio',
    role: 'Product Manager',
    relationship_type: 'Project Collaborator',
    notes: 'Drives product decisions. Focuses on user experience and timeline alignment.',
  },
  {
    name: 'Arjun Patel',
    email: 'arjun@cloudops.dev',
    company: 'CloudOps Solutions',
    role: 'DevOps Engineer',
    relationship_type: 'Vendor',
    notes: 'Manages our cloud infrastructure. Responsive but stretched thin across multiple clients.',
  },
];

const rahulMeetings: SeedMeeting[] = [
  {
    title: 'Project Introduction',
    meeting_date: '2026-09-05',
    duration_minutes: 45,
    raw_notes: 'Met with Rahul for the first time to introduce the API integration project. Discussed overall goals: we need to integrate our frontend with their backend API. Rahul outlined their team structure — 4 backend engineers, 2 QA. He mentioned they use REST with JSON payloads. We agreed to have weekly sync meetings. No specific deadlines set yet. Rahul seems knowledgeable and collaborative.',
  },
  {
    title: 'API Requirements Discussion',
    meeting_date: '2026-09-12',
    duration_minutes: 60,
    raw_notes: 'Discussed API requirements in detail. Rahul said they will provide comprehensive API documentation covering all endpoints. We reviewed the authentication approach — they prefer JWT-based auth with refresh tokens. Rahul mentioned rate limiting will be set at 1000 requests per minute. I asked about webhook support and Rahul said he would check with his team. We discussed the data format for user profiles and agreed on a standardized schema. Rahul promised to share the API documentation by September 23.',
  },
  {
    title: 'Authentication and Deployment Planning',
    meeting_date: '2026-09-20',
    duration_minutes: 75,
    raw_notes: 'Met with Rahul to discuss authentication flow and deployment timeline. Rahul confirmed the API documentation would be shared by September 23. He said JWT tokens will have a 15-minute expiry with refresh tokens valid for 7 days. I promised to complete the frontend integration within one week of receiving the documentation. We discussed the deployment target — September 30 for the initial production release. Rahul said they will handle the backend deployment and database migration. Open question: how should we handle token refresh during active sessions? We also discussed error handling standards — Rahul agreed to provide standard error response formats in the documentation. Important: the staging environment will be available by September 25 for testing.',
  },
  {
    title: 'Frontend Integration Progress',
    meeting_date: '2026-09-26',
    duration_minutes: 30,
    raw_notes: 'Quick sync with Rahul on frontend integration progress. Discussed the current state of the frontend work. I showed him the login flow prototype. He mentioned the API documentation status — still being finalized. No new commitments made. We agreed to meet again once the documentation is shared.',
  },
];

const rahulCommitments: SeedCommitment[] = [
  {
    description: 'Share comprehensive API documentation',
    owner: 'contact',
    status: 'open',
    due_date: '2026-09-23',
  },
  {
    description: 'Complete frontend integration after receiving documentation',
    owner: 'user',
    status: 'open',
    due_date: '2026-09-30',
  },
  {
    description: 'Provide staging environment for testing',
    owner: 'contact',
    status: 'open',
    due_date: '2026-09-25',
  },
  {
    description: 'Set up weekly sync meetings',
    owner: 'user',
    status: 'completed',
    due_date: '2026-09-12',
  },
];

const priyaMeetings: SeedMeeting[] = [
  {
    title: 'Product Roadmap Review',
    meeting_date: '2026-09-08',
    duration_minutes: 60,
    raw_notes: 'Met with Priya to review the Q4 product roadmap. She presented three key features: dashboard redesign, analytics module, and user onboarding flow. I raised concerns about the timeline for the analytics module. Priya agreed to prioritize the dashboard redesign first. She promised to share the detailed PRD by September 15. We discussed user research findings — 70% of users want better data visualization.',
  },
  {
    title: 'Dashboard Redesign Kickoff',
    meeting_date: '2026-09-18',
    duration_minutes: 90,
    raw_notes: 'Kickoff meeting for the dashboard redesign. Priya shared wireframes and design mockups. We discussed the information architecture and agreed on a card-based layout. I committed to delivering the frontend components by October 5. Priya said she would arrange a design review with stakeholders by September 28. Open question: should we support dark mode in the initial release? Important: the analytics module is deferred to Q1 next year.',
  },
];

const priyaCommitments: SeedCommitment[] = [
  {
    description: 'Share detailed PRD for dashboard redesign',
    owner: 'contact',
    status: 'completed',
    due_date: '2026-09-15',
  },
  {
    description: 'Deliver frontend components for dashboard',
    owner: 'user',
    status: 'open',
    due_date: '2026-10-05',
  },
  {
    description: 'Arrange design review with stakeholders',
    owner: 'contact',
    status: 'open',
    due_date: '2026-09-28',
  },
];

const arjunMeetings: SeedMeeting[] = [
  {
    title: 'Infrastructure Assessment',
    meeting_date: '2026-09-10',
    duration_minutes: 60,
    raw_notes: 'Met with Arjun to assess our cloud infrastructure needs. He recommended migrating to a containerized setup. Discussed AWS vs GCP — Arjun suggested GCP for better cost efficiency. He promised to provide a migration proposal by September 20. I mentioned we need minimal downtime during migration. Arjun said he would plan a blue-green deployment strategy.',
  },
  {
    title: 'Migration Proposal Review',
    meeting_date: '2026-09-22',
    duration_minutes: 45,
    raw_notes: 'Reviewed Arjun\'s migration proposal. He presented a 4-week migration plan with estimated costs. The proposal includes containerization with Docker and orchestration with Kubernetes. I asked about security considerations — Arjun said he would include a security audit in week 2. He promised to start the migration by October 1 pending our approval. I committed to getting internal approval by September 28. Important: Arjun mentioned his availability is limited in October due to other client commitments.',
  },
];

const arjunCommitments: SeedCommitment[] = [
  {
    description: 'Provide migration proposal',
    owner: 'contact',
    status: 'completed',
    due_date: '2026-09-20',
  },
  {
    description: 'Get internal approval for migration',
    owner: 'user',
    status: 'open',
    due_date: '2026-09-28',
  },
  {
    description: 'Start migration by October 1',
    owner: 'contact',
    status: 'open',
    due_date: '2026-10-01',
  },
  {
    description: 'Include security audit in week 2 of migration',
    owner: 'contact',
    status: 'open',
    due_date: '2026-10-15',
  },
];

export async function seedDemoData(): Promise<{ success: boolean; message: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: 'You must be signed in to seed demo data.' };
  }

  // Check if demo data already exists
  const { data: existing } = await supabase
    .from('contacts')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', 'Rahul Sharma')
    .maybeSingle();

  if (existing) {
    return { success: false, message: 'Demo data already exists. Delete your contacts first to re-seed.' };
  }

  try {
    // Create contacts
    const contactData = demoContacts.map((c) => ({ ...c, user_id: user.id }));
    const { data: createdContacts, error: contactErr } = await supabase
      .from('contacts')
      .insert(contactData)
      .select();

    if (contactErr || !createdContacts) throw new Error('Failed to create contacts');

    const [rahul, priya, arjun] = createdContacts;

    // Create Rahul's meetings
    const rahulMeetingData = rahulMeetings.map((m) => ({
      ...m,
      user_id: user.id,
      contact_id: rahul.id,
      extraction_status: 'completed',
      // Pre-populate extracted data for demo
      summary: m.title === 'Project Introduction'
        ? 'Initial meeting to introduce the API integration project and discuss goals.'
        : m.title === 'API Requirements Discussion'
        ? 'Detailed discussion of API requirements, authentication approach, and documentation timeline.'
        : m.title === 'Authentication and Deployment Planning'
        ? 'Discussion of JWT authentication flow, deployment timeline targeting September 30, and staging environment availability.'
        : 'Quick sync on frontend integration progress and documentation status.',
    }));

    const { data: createdRahulMeetings } = await supabase
      .from('meetings')
      .insert(rahulMeetingData)
      .select();

    // Add extracted fields to Rahul's meetings
    if (createdRahulMeetings) {
      // Meeting 2: API Requirements
      await supabase.from('meetings').update({
        topics: ['API Requirements', 'Authentication', 'Rate Limiting', 'Data Format', 'Webhooks'],
        decisions: ['Use JWT-based auth with refresh tokens', 'Rate limit: 1000 req/min', 'Standardized user profile schema'],
        user_commitments: [],
        contact_commitments: ['Share comprehensive API documentation by September 23'],
        deadlines: [{ description: 'API documentation', date: '2026-09-23', owner: 'contact' }],
        follow_ups: ['Webhook support confirmation', 'API documentation delivery'],
        open_questions: ['Webhook support availability', 'Standard error response formats'],
        important_facts: ['REST with JSON payloads', '4 backend engineers, 2 QA on their team', 'Weekly sync meetings agreed'],
      }).eq('id', createdRahulMeetings[1].id);

      // Meeting 3: Auth and Deployment
      await supabase.from('meetings').update({
        topics: ['Authentication', 'Deployment', 'Token Refresh', 'Error Handling', 'Staging Environment'],
        decisions: ['JWT tokens: 15-min expiry, 7-day refresh tokens', 'Deployment target: September 30', 'Backend handles deployment and DB migration'],
        user_commitments: ['Complete frontend integration within one week of receiving documentation'],
        contact_commitments: ['Provide staging environment by September 25', 'Share API documentation by September 23', 'Include standard error response formats in documentation'],
        deadlines: [
          { description: 'Frontend integration', date: '2026-09-30', owner: 'user' },
          { description: 'Staging environment', date: '2026-09-25', owner: 'contact' },
          { description: 'API documentation', date: '2026-09-23', owner: 'contact' },
        ],
        follow_ups: ['Token refresh handling during active sessions', 'Error handling standards in documentation'],
        open_questions: ['How to handle token refresh during active sessions?'],
        important_facts: ['Deployment target is September 30', 'Staging available by September 25', 'JWT 15-min expiry with 7-day refresh'],
      }).eq('id', createdRahulMeetings[2].id);

      // Meeting 1: Introduction
      await supabase.from('meetings').update({
        topics: ['Project Introduction', 'Team Structure', 'API Standards'],
        decisions: ['Weekly sync meetings', 'REST with JSON payloads'],
        user_commitments: [],
        contact_commitments: [],
        deadlines: [],
        follow_ups: [],
        open_questions: [],
        important_facts: ['4 backend engineers, 2 QA on Rahul\'s team', 'REST API with JSON payloads', 'Weekly sync meetings established'],
      }).eq('id', createdRahulMeetings[0].id);

      // Meeting 4: Frontend Progress
      await supabase.from('meetings').update({
        topics: ['Frontend Integration', 'Login Flow', 'Documentation Status'],
        decisions: [],
        user_commitments: [],
        contact_commitments: [],
        deadlines: [],
        follow_ups: ['Meet again once documentation is shared'],
        open_questions: ['When will API documentation be available?'],
        important_facts: ['API documentation still being finalized', 'Login flow prototype shown'],
      }).eq('id', createdRahulMeetings[3].id);
    }

    // Create Rahul's commitments
    const rahulComData = rahulCommitments.map((c) => ({
      ...c,
      user_id: user.id,
      contact_id: rahul.id,
      meeting_id: createdRahulMeetings?.[rahulCommitments.findIndex(rc => rc.description === c.description)]?.id ?? null,
      source: 'ai_extracted',
      completed_at: c.status === 'completed' ? '2026-09-12T10:00:00Z' : null,
    }));
    await supabase.from('commitments').insert(rahulComData);

    // Create Priya's meetings
    const priyaMeetingData = priyaMeetings.map((m) => ({
      ...m,
      user_id: user.id,
      contact_id: priya.id,
      extraction_status: 'completed',
      summary: m.title === 'Product Roadmap Review'
        ? 'Reviewed Q4 product roadmap covering dashboard redesign, analytics module, and user onboarding.'
        : 'Kickoff meeting for the dashboard redesign with wireframes and design mockups.',
    }));

    const { data: createdPriyaMeetings } = await supabase
      .from('meetings')
      .insert(priyaMeetingData)
      .select();

    if (createdPriyaMeetings) {
      await supabase.from('meetings').update({
        topics: ['Product Roadmap', 'Dashboard Redesign', 'Analytics Module', 'User Onboarding'],
        decisions: ['Prioritize dashboard redesign first', 'Analytics module deferred'],
        user_commitments: [],
        contact_commitments: ['Share detailed PRD by September 15'],
        deadlines: [{ description: 'PRD delivery', date: '2026-09-15', owner: 'contact' }],
        follow_ups: ['PRD delivery', 'Analytics module scoping for Q1'],
        open_questions: ['Timeline for analytics module'],
        important_facts: ['70% of users want better data visualization', 'Three key Q4 features: dashboard, analytics, onboarding'],
      }).eq('id', createdPriyaMeetings[0].id);

      await supabase.from('meetings').update({
        topics: ['Dashboard Redesign', 'Information Architecture', 'Design Mockups', 'Dark Mode'],
        decisions: ['Card-based layout for dashboard', 'Analytics module deferred to Q1'],
        user_commitments: ['Deliver frontend components by October 5'],
        contact_commitments: ['Arrange design review with stakeholders by September 28'],
        deadlines: [
          { description: 'Frontend components', date: '2026-10-05', owner: 'user' },
          { description: 'Design review', date: '2026-09-28', owner: 'contact' },
        ],
        follow_ups: ['Design review scheduling', 'Dark mode decision'],
        open_questions: ['Should we support dark mode in initial release?'],
        important_facts: ['Analytics module deferred to Q1 next year', 'Card-based layout agreed'],
      }).eq('id', createdPriyaMeetings[1].id);
    }

    // Create Priya's commitments
    const priyaComData = priyaCommitments.map((c) => ({
      ...c,
      user_id: user.id,
      contact_id: priya.id,
      meeting_id: createdPriyaMeetings?.[0]?.id ?? null,
      source: 'ai_extracted',
      completed_at: c.status === 'completed' ? '2026-09-15T10:00:00Z' : null,
    }));
    await supabase.from('commitments').insert(priyaComData);

    // Create Arjun's meetings
    const arjunMeetingData = arjunMeetings.map((m) => ({
      ...m,
      user_id: user.id,
      contact_id: arjun.id,
      extraction_status: 'completed',
      summary: m.title === 'Infrastructure Assessment'
        ? 'Assessed cloud infrastructure needs and discussed migration to containerized setup.'
        : 'Reviewed migration proposal with 4-week plan, Docker/Kubernetes, and security audit.',
    }));

    const { data: createdArjunMeetings } = await supabase
      .from('meetings')
      .insert(arjunMeetingData)
      .select();

    if (createdArjunMeetings) {
      await supabase.from('meetings').update({
        topics: ['Cloud Infrastructure', 'Containerization', 'AWS vs GCP', 'Migration Strategy'],
        decisions: ['Consider GCP for cost efficiency', 'Blue-green deployment strategy'],
        user_commitments: [],
        contact_commitments: ['Provide migration proposal by September 20'],
        deadlines: [{ description: 'Migration proposal', date: '2026-09-20', owner: 'contact' }],
        follow_ups: ['Migration proposal review'],
        open_questions: ['AWS vs GCP final decision'],
        important_facts: ['Arjun recommends GCP for cost efficiency', 'Blue-green deployment for minimal downtime'],
      }).eq('id', createdArjunMeetings[0].id);

      await supabase.from('meetings').update({
        topics: ['Migration Plan', 'Docker', 'Kubernetes', 'Security Audit', 'Cost Estimates'],
        decisions: ['4-week migration plan', 'Docker + Kubernetes stack', 'Security audit in week 2'],
        user_commitments: ['Get internal approval by September 28'],
        contact_commitments: ['Start migration by October 1', 'Include security audit in week 2'],
        deadlines: [
          { description: 'Internal approval', date: '2026-09-28', owner: 'user' },
          { description: 'Migration start', date: '2026-10-01', owner: 'contact' },
          { description: 'Security audit', date: '2026-10-15', owner: 'contact' },
        ],
        follow_ups: ['Internal approval process', 'Migration scheduling'],
        open_questions: [],
        important_facts: ['Arjun has limited availability in October', '4-week migration plan with cost estimates'],
      }).eq('id', createdArjunMeetings[1].id);
    }

    // Create Arjun's commitments
    const arjunComData = arjunCommitments.map((c) => ({
      ...c,
      user_id: user.id,
      contact_id: arjun.id,
      meeting_id: createdArjunMeetings?.[0]?.id ?? null,
      source: 'ai_extracted',
      completed_at: c.status === 'completed' ? '2026-09-20T10:00:00Z' : null,
    }));
    await supabase.from('commitments').insert(arjunComData);

    return {
      success: true,
      message: 'Demo data created: 3 contacts (Rahul Sharma, Priya Nair, Arjun Patel) with 8 meetings and 12 commitments. Go to Rahul Sharma and click "Prepare Me" to see the memory demo!',
    };
  } catch (err) {
    return { success: false, message: `Failed to seed demo data: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}
