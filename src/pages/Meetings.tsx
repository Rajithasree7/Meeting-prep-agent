import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Clock, Tag, AlertTriangle } from 'lucide-react';
import { fetchMeetings } from '@/lib/meetings';
import { fetchContacts } from '@/lib/contacts';
import { formatDate, getInitials } from '@/lib/utils';
import type { Meeting, Contact } from '@/types';
import EmptyState from '@/components/EmptyState';
import { ListSkeleton } from '@/components/Skeleton';

export default function Meetings() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [m, c] = await Promise.all([fetchMeetings(), fetchContacts()]);
        setMeetings(m);
        setContacts(c);
      } catch {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const contactMap = new Map(contacts.map((c) => [c.id, c]));

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Meetings</h1>
          <p className="text-neutral-500 mt-1">All your recorded interactions</p>
        </div>
      </div>

      {loading ? (
        <ListSkeleton count={4} />
      ) : meetings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No meetings yet"
          description="Add interactions from a contact's page to start building memory."
          action={
            <button onClick={() => navigate('/contacts')} className="btn-primary">
              Go to Contacts
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => {
            const contact = contactMap.get(meeting.contact_id);
            return (
              <div
                key={meeting.id}
                onClick={() => navigate(`/contacts/${meeting.contact_id}`)}
                className="card p-5 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold shrink-0">
                    {contact ? getInitials(contact.name) : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-neutral-900 truncate">{meeting.title}</h3>
                      <span className="text-xs text-neutral-500 shrink-0">{formatDate(meeting.meeting_date)}</span>
                    </div>
                    <p className="text-sm text-neutral-500 mb-2">{contact?.name}</p>
                    {meeting.summary && (
                      <p className="text-sm text-neutral-700 line-clamp-2 mb-2">{meeting.summary}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      {meeting.topics.slice(0, 4).map((topic, i) => (
                        <span key={i} className="badge-neutral text-[10px]">
                          <Tag className="w-2.5 h-2.5" /> {topic}
                        </span>
                      ))}
                      {meeting.topics.length > 4 && (
                        <span className="text-xs text-neutral-400">+{meeting.topics.length - 4} more</span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-neutral-400">
                        <Clock className="w-3 h-3" /> {meeting.duration_minutes}m
                      </span>
                      {meeting.extraction_status === 'completed' && (
                        <span className="badge-success text-[10px]">AI Extracted</span>
                      )}
                      {meeting.extraction_status === 'pending' && (
                        <span className="badge-warning text-[10px]">Pending</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
