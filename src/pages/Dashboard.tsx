import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  CheckSquare,
  AlertTriangle,
  ArrowRight,
  Brain,
  Clock,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchContacts } from '@/lib/contacts';
import { fetchMeetings } from '@/lib/meetings';
import { fetchCommitments } from '@/lib/commitments';
import { fetchPreferences } from '@/lib/preferences';
import { isOverdue, getInitials, formatDateShort, formatRelativeDate } from '@/lib/utils';
import type { Contact, Meeting, Commitment, UserPreference } from '@/types';
import { CardSkeleton, ListSkeleton } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import { seedDemoData } from '@/lib/seedDemo';
import { Zap } from 'lucide-react';

interface DashboardData {
  contacts: Contact[];
  meetings: Meeting[];
  commitments: Commitment[];
  preferences: UserPreference[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const result = await seedDemoData();
      showToast(result.message, result.success ? 'success' : 'error');
      if (result.success) {
        const [contacts, meetings, commitments, preferences] = await Promise.all([
          fetchContacts(),
          fetchMeetings(),
          fetchCommitments(),
          fetchPreferences(),
        ]);
        setData({ contacts, meetings, commitments, preferences });
      }
    } catch {
      showToast('Failed to load demo data', 'error');
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const [contacts, meetings, commitments, preferences] = await Promise.all([
          fetchContacts(),
          fetchMeetings(),
          fetchCommitments(),
          fetchPreferences(),
        ]);
        setData({ contacts, meetings, commitments, preferences });
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const userName = (user?.user_metadata as { name?: string } | null)?.name ?? 'there';

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="skeleton h-8 w-64 rounded mb-2" />
        <div className="skeleton h-4 w-48 rounded mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <ListSkeleton count={3} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <EmptyState
          icon={AlertTriangle}
          title="Something went wrong"
          description="We couldn't load your dashboard. Please try again."
          action={<button onClick={() => window.location.reload()} className="btn-primary">Reload</button>}
        />
      </div>
    );
  }

  const { contacts, meetings, commitments, preferences } = data;

  const upcomingMeetings = meetings
    .filter((m) => new Date(m.meeting_date) >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime())
    .slice(0, 5);

  const recentMeetings = meetings.slice(0, 5);

  const openCommitments = commitments.filter((c) => c.status === 'open');
  const overdueCommitments = openCommitments.filter(
    (c) => c.due_date && isOverdue(c.due_date)
  );

  const stats = [
    {
      label: 'Contacts',
      value: contacts.length,
      icon: Users,
      color: 'text-primary-600 bg-primary-50',
      link: '/contacts',
    },
    {
      label: 'Upcoming Meetings',
      value: upcomingMeetings.length,
      icon: Calendar,
      color: 'text-accent-600 bg-accent-50',
      link: '/meetings',
    },
    {
      label: 'Open Commitments',
      value: openCommitments.length,
      icon: CheckSquare,
      color: 'text-warning-600 bg-warning-50',
      link: '/commitments',
    },
    {
      label: 'Overdue Follow-ups',
      value: overdueCommitments.length,
      icon: AlertTriangle,
      color: 'text-error-600 bg-error-50',
      link: '/commitments',
    },
  ];

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">
          {greeting}, {userName.split(' ')[0]}
        </h1>
        <p className="text-neutral-500 mt-1">
          {upcomingMeetings.length > 0
            ? `You have ${upcomingMeetings.length} upcoming meeting${upcomingMeetings.length > 1 ? 's' : ''}.`
            : 'No upcoming meetings scheduled.'}
          {overdueCommitments.length > 0 &&
            ` ${overdueCommitments.length} potentially overdue follow-up${overdueCommitments.length > 1 ? 's' : ''}.`}
          {preferences.length > 0 && ` ${preferences.length} learned preferences.`}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, link }) => (
          <Link
            key={label}
            to={link}
            className="card p-5 hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-3xl font-bold text-neutral-900">{value}</p>
            <p className="text-sm text-neutral-500 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Meetings */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-neutral-900">Upcoming Meetings</h2>
            <Link to="/meetings" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>
          {upcomingMeetings.length === 0 && contacts.length === 0 ? (
            <EmptyState
              icon={Zap}
              title="Welcome to Meeting Prep Agent"
              description="Load demo data to see the full memory experience — 3 contacts, 8 meetings, and tracked commitments."
              action={
                <button onClick={handleSeedDemo} disabled={seeding} className="btn-accent">
                  {seeding ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Zap className="w-4 h-4" /> Load Demo Data</>}
                </button>
              }
            />
          ) : upcomingMeetings.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No upcoming meetings"
              description="Add a new interaction to start building meeting context."
            />
          ) : (
            <div className="space-y-3">
              {upcomingMeetings.map((meeting) => {
                const contact = contacts.find((c) => c.id === meeting.contact_id);
                return (
                  <div
                    key={meeting.id}
                    onClick={() => navigate(`/contacts/${meeting.contact_id}`)}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold shrink-0">
                      {contact ? getInitials(contact.name) : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 text-sm truncate">{meeting.title}</p>
                      <p className="text-xs text-neutral-500 truncate">
                        {contact?.name} · {formatRelativeDate(meeting.meeting_date)}
                      </p>
                    </div>
                    {contact && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/contacts/${contact.id}`);
                        }}
                        className="btn-accent text-xs px-3 py-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Prepare
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Overdue Follow-ups */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-neutral-900">Potential Overdue</h2>
            <Link to="/commitments" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>
          {overdueCommitments.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="All clear"
              description="No overdue follow-ups detected."
            />
          ) : (
            <div className="space-y-3">
              {overdueCommitments.slice(0, 5).map((commitment) => {
                const contact = contacts.find((c) => c.id === commitment.contact_id);
                return (
                  <div
                    key={commitment.id}
                    onClick={() => navigate(`/contacts/${commitment.contact_id}`)}
                    className="p-3 rounded-xl border border-error-200 bg-error-50/50 cursor-pointer hover:bg-error-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-neutral-900 line-clamp-2">
                      {commitment.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="badge-error">
                        <Clock className="w-3 h-3" />
                        {formatDateShort(commitment.due_date!)}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {commitment.owner === 'contact' ? `${contact?.name ?? 'They'} promised` : 'You promised'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Interactions */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-neutral-900">Recent Interactions</h2>
            <Link to="/meetings" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>
          {recentMeetings.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No interactions yet"
              description="Start by adding a contact and recording your first meeting."
              action={
                <Link to="/contacts" className="btn-primary">
                  Add Contact
                </Link>
              }
            />
          ) : (
            <div className="space-y-2">
              {recentMeetings.map((meeting) => {
                const contact = contacts.find((c) => c.id === meeting.contact_id);
                return (
                  <div
                    key={meeting.id}
                    onClick={() => navigate(`/contacts/${meeting.contact_id}`)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">{meeting.title}</p>
                      <p className="text-xs text-neutral-500">
                        {contact?.name} · {formatDateShort(meeting.meeting_date)}
                      </p>
                    </div>
                    {meeting.extraction_status === 'completed' && (
                      <span className="badge-success text-[10px]">AI Extracted</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Memory Insights */}
        <div className="card p-6 bg-gradient-to-br from-primary-50 to-accent-50/40 border-primary-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900">Memory Insights</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">Remembered interactions</span>
              <span className="font-semibold text-neutral-900">{meetings.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">Learned preferences</span>
              <span className="font-semibold text-neutral-900">{preferences.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">Tracked commitments</span>
              <span className="font-semibold text-neutral-900">{commitments.length}</span>
            </div>
            <Link
              to="/memory"
              className="btn-primary w-full mt-4 text-xs"
            >
              <Sparkles className="w-4 h-4" />
              View Memory Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
