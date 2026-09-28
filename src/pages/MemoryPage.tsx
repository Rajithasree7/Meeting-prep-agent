import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Sparkles,
  TrendingUp,
  Zap,
  ArrowRight,
  CheckCircle,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Meh,
  Lightbulb,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { fetchPreferences } from '@/lib/preferences';
import { fetchFeedbackHistory } from '@/lib/preferences';
import { fetchContacts } from '@/lib/contacts';
import { fetchMeetings } from '@/lib/meetings';
import { prepareMeeting } from '@/lib/api';
import type { UserPreference, MemoryFeedback, Contact, Meeting, Briefing } from '@/types';
import { CardSkeleton, ListSkeleton } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import { getInitials } from '@/lib/utils';

export default function MemoryPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [preferences, setPreferences] = useState<UserPreference[]>([]);
  const [feedback, setFeedback] = useState<MemoryFeedback[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  // Before/After demo state
  const [demoContact, setDemoContact] = useState<Contact | null>(null);
  const [demoBriefing, setDemoBriefing] = useState<Briefing | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [showWithMemory, setShowWithMemory] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [prefs, fb, c, m] = await Promise.all([
          fetchPreferences(),
          fetchFeedbackHistory(),
          fetchContacts(),
          fetchMeetings(),
        ]);
        setPreferences(prefs);
        setFeedback(fb);
        setContacts(c);
        setMeetings(m);

        // Auto-select demo contact: the one with the most meetings
        if (c.length > 0 && m.length > 0) {
          const meetingCounts = new Map<string, number>();
          m.forEach((mtg) => {
            meetingCounts.set(mtg.contact_id, (meetingCounts.get(mtg.contact_id) ?? 0) + 1);
          });
          let best: Contact | null = null;
          let bestCount = 0;
          c.forEach((contact) => {
            const count = meetingCounts.get(contact.id) ?? 0;
            if (count > bestCount) {
              bestCount = count;
              best = contact;
            }
          });
          if (best && bestCount >= 2) setDemoContact(best);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const runDemo = async () => {
    if (!demoContact) return;
    setDemoLoading(true);
    setShowWithMemory(true);
    setDemoBriefing(null);
    try {
      const result = await prepareMeeting(demoContact.id, demoContact.name);
      setDemoBriefing(result.briefing);
    } catch {
      showToast('Could not generate demo briefing. Make sure Hindsight is configured.', 'error');
    } finally {
      setDemoLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="skeleton h-8 w-48 rounded mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <ListSkeleton count={3} />
      </div>
    );
  }

  const feedbackIcons = {
    very_useful: { icon: ThumbsUp, color: 'text-success-600 bg-success-50' },
    useful: { icon: Meh, color: 'text-primary-600 bg-primary-50' },
    not_useful: { icon: ThumbsDown, color: 'text-error-600 bg-error-50' },
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Memory</h1>
        <p className="text-neutral-500 mt-1">
          How your AI agent learns and remembers across meetings
        </p>
      </div>

      {/* What I've Learned About You */}
      <div className="card p-6 mb-6 bg-gradient-to-br from-primary-50/50 to-accent-50/30 border-primary-100">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">What I've Learned About You</h2>
            <p className="text-xs text-neutral-500">Preferences that emerge from your interactions and feedback</p>
          </div>
        </div>

        {preferences.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm text-neutral-500 mb-1">No preferences learned yet</p>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              As you use the Prepare Me feature and provide feedback, the agent will learn how you like your briefings.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {preferences.map((pref) => (
              <div key={pref.id} className="bg-white rounded-xl p-4 border border-neutral-200">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{pref.preference_value}</p>
                    <span className={`text-[10px] mt-1 inline-block ${pref.source === 'explicit' ? 'text-primary-600' : 'text-neutral-400'}`}>
                      {pref.source === 'explicit' ? 'Explicitly stated' : 'Inferred from behavior'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Before vs After Memory */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-1">Without Memory vs With Hindsight</h2>
        <p className="text-sm text-neutral-500 mb-4">
          See the difference persistent memory makes in meeting preparation
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Without Memory */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-neutral-200 flex items-center justify-center">
                <EyeOff className="w-4 h-4 text-neutral-500" />
              </div>
              <h3 className="font-semibold text-neutral-700">Without Memory</h3>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl bg-neutral-50 p-4">
                <p className="text-sm text-neutral-500 italic">
                  "Review project progress and discuss next steps."
                </p>
              </div>
              <div className="space-y-2">
                {[
                  'No awareness of past discussions',
                  'Generic preparation advice',
                  'No tracking of commitments',
                  'Cannot recall unresolved items',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-neutral-500">
                    <XCircle className="w-4 h-4 text-neutral-400 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* With Hindsight */}
          <div className="card p-6 bg-gradient-to-br from-primary-50/40 to-accent-50/20 border-primary-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-primary-800">With Hindsight</h3>
            </div>

            {!demoContact ? (
              <div className="text-center py-8">
                <p className="text-sm text-neutral-500 mb-3">
                  Add at least 2 interactions with a contact to see the memory difference.
                </p>
                <button onClick={() => navigate('/contacts')} className="btn-secondary text-sm">
                  Go to Contacts <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : !showWithMemory ? (
              <div className="text-center py-8">
                <p className="text-sm text-neutral-600 mb-4">
                  Run a live "Prepare Me" for <strong>{demoContact.name}</strong> using recalled memories from {meetings.filter(m => m.contact_id === demoContact.id).length} interactions.
                </p>
                <button onClick={runDemo} className="btn-accent">
                  <Sparkles className="w-4 h-4" /> Run Live Demo
                </button>
              </div>
            ) : demoLoading ? (
              <div className="flex flex-col items-center py-8">
                <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-3" />
                <p className="text-sm text-neutral-500">Recalling memories from Hindsight...</p>
              </div>
            ) : demoBriefing ? (
              <div className="space-y-3 animate-fade-in">
                <div className="rounded-xl bg-white p-4 border border-primary-100">
                  <p className="text-sm text-neutral-700 font-medium mb-2">{demoBriefing.relationshipContext}</p>
                </div>
                {demoBriefing.theirCommitments.length > 0 && (
                  <div className="rounded-xl bg-white p-3 border border-primary-100">
                    <p className="text-xs font-semibold text-neutral-500 mb-1">Their Commitments</p>
                    {demoBriefing.theirCommitments.map((c, i) => (
                      <p key={i} className="text-sm text-neutral-700 flex items-start gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-warning-500 shrink-0 mt-0.5" />
                        {c}
                      </p>
                    ))}
                  </div>
                )}
                {demoBriefing.yourCommitments.length > 0 && (
                  <div className="rounded-xl bg-white p-3 border border-primary-100">
                    <p className="text-xs font-semibold text-neutral-500 mb-1">Your Commitments</p>
                    {demoBriefing.yourCommitments.map((c, i) => (
                      <p key={i} className="text-sm text-neutral-700 flex items-start gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-success-500 shrink-0 mt-0.5" />
                        {c}
                      </p>
                    ))}
                  </div>
                )}
                {demoBriefing.missedFollowUps.length > 0 && (
                  <div className="rounded-xl bg-error-50 p-3 border border-error-200">
                    <p className="text-xs font-semibold text-error-700 mb-1">Overdue Follow-ups</p>
                    {demoBriefing.missedFollowUps.map((c, i) => (
                      <p key={i} className="text-sm text-error-700 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        {c}
                      </p>
                    ))}
                  </div>
                )}
                {demoBriefing.suggestedTalkingPoints.length > 0 && (
                  <div className="rounded-xl bg-white p-3 border border-primary-100">
                    <p className="text-xs font-semibold text-neutral-500 mb-1">Suggested Questions</p>
                    {demoBriefing.suggestedTalkingPoints.slice(0, 3).map((c, i) => (
                      <p key={i} className="text-sm text-neutral-700 flex items-start gap-1.5">
                        <span className="text-primary-500 font-medium shrink-0">{i + 1}.</span>
                        {c}
                      </p>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => navigate(`/contacts/${demoContact.id}`)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  View Full Briefing <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Memory Demo Section */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Memory Demo</h2>
            <p className="text-xs text-neutral-500">See how memories from multiple meetings combine into context</p>
          </div>
        </div>

        {contacts.length === 0 ? (
          <EmptyState
            icon={Brain}
            title="No contacts yet"
            description="Add contacts and interactions to see the memory demo in action."
            action={<button onClick={() => navigate('/contacts')} className="btn-primary">Add Contacts</button>}
          />
        ) : (
          <div>
            <p className="text-sm text-neutral-600 mb-4">
              Select a contact to run "Prepare Me" and see how the agent recalls memories from past interactions:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {contacts.map((contact) => {
                const contactMeetings = meetings.filter((m) => m.contact_id === contact.id);
                const isSelected = demoContact?.id === contact.id;
                return (
                  <button
                    key={contact.id}
                    onClick={() => setDemoContact(contact)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-primary-400 bg-primary-50 ring-2 ring-primary-200'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
                        {getInitials(contact.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">{contact.name}</p>
                        <p className="text-xs text-neutral-500 truncate">{contact.role}</p>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-500">
                      {contactMeetings.length} interaction{contactMeetings.length !== 1 ? 's' : ''}
                    </p>
                  </button>
                );
              })}
            </div>
            {demoContact && (
              <div className="mt-4 flex items-center gap-3">
                <button onClick={runDemo} disabled={demoLoading} className="btn-accent">
                  {demoLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Prepare Me for {demoContact.name.split(' ')[0]}</>
                  )}
                </button>
                {demoBriefing && (
                  <button onClick={() => navigate(`/contacts/${demoContact.id}`)} className="btn-secondary text-sm">
                    View Full Briefing
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Feedback History */}
      <div className="card p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-neutral-600" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-900">Feedback History</h2>
        </div>

        {feedback.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-6">
            No feedback yet. Rate your briefings to help the agent learn.
          </p>
        ) : (
          <div className="space-y-2">
            {feedback.slice(0, 10).map((fb) => {
              const config = feedbackIcons[fb.rating] ?? feedbackIcons.useful;
              const Icon = config.icon;
              return (
                <div key={fb.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-neutral-50">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 capitalize">
                      {fb.rating.replace('_', ' ')}
                    </p>
                    {fb.improvement_suggestion && (
                      <p className="text-sm text-neutral-600 mt-0.5">{fb.improvement_suggestion}</p>
                    )}
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {new Date(fb.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
