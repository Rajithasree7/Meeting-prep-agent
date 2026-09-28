import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Plus,
  Pencil,
  Mail,
  Building2,
  Briefcase,
  Brain,
  Calendar,
  CheckSquare,
  ListChecks,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { fetchContact, updateContact } from '@/lib/contacts';
import { fetchMeetingsByContact, createMeeting } from '@/lib/meetings';
import { fetchCommitmentsByContact, createCommitment, updateCommitment } from '@/lib/commitments';
import { extractMeeting, prepareMeeting } from '@/lib/api';
import { getInitials, formatDate, getCommitmentStatus, isOverdue } from '@/lib/utils';
import type { Contact, Meeting, Commitment, Briefing } from '@/types';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import PreparationBrief from '@/components/PreparationBrief';
import MemoryTimeline from '@/components/MemoryTimeline';
import { useToast } from '@/components/Toast';

type Tab = 'overview' | 'interactions' | 'commitments' | 'timeline';

export default function ContactDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [contact, setContact] = useState<Contact | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');

  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    meeting_date: new Date().toISOString().split('T')[0],
    duration_minutes: 60,
    raw_notes: '',
  });
  const [savingMeeting, setSavingMeeting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<string | null>(null);

  const [preparing, setPreparing] = useState(false);
  const [briefing, setBriefing] = useState<Briefing | null>(null);

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    relationship_type: 'Contact',
    notes: '',
  });

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [c, m, com] = await Promise.all([
        fetchContact(id),
        fetchMeetingsByContact(id),
        fetchCommitmentsByContact(id),
      ]);
      setContact(c);
      setMeetings(m);
      setCommitments(com);
      if (c) {
        setEditForm({
          name: c.name,
          email: c.email ?? '',
          company: c.company ?? '',
          role: c.role ?? '',
          relationship_type: c.relationship_type,
          notes: c.notes ?? '',
        });
      }
    } catch {
      showToast('Failed to load contact', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleSaveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !contact) return;
    setSavingMeeting(true);
    setExtractionStatus(null);
    try {
      const meeting = await createMeeting({
        contact_id: id,
        title: meetingForm.title,
        meeting_date: meetingForm.meeting_date,
        duration_minutes: meetingForm.duration_minutes,
        raw_notes: meetingForm.raw_notes,
      });

      showToast('Meeting saved. Analyzing notes with AI...', 'success');
      setMeetingModalOpen(false);
      setMeetingForm({ title: '', meeting_date: new Date().toISOString().split('T')[0], duration_minutes: 60, raw_notes: '' });

      // Trigger AI extraction
      setExtractionStatus('extracting');
      try {
        const result = await extractMeeting(meeting.id, meetingForm.raw_notes, contact.name);
        setExtractionStatus('done');
        showToast('AI extraction complete. Memory retained in Hindsight.', 'success');
        // Reload to get extracted data + auto-created commitments
        load();
      } catch (err) {
        setExtractionStatus('error');
        showToast('Meeting saved, but AI extraction is temporarily unavailable. Memory sync will need to be retried.', 'error');
        load();
      }
    } catch {
      showToast('Failed to save meeting', 'error');
    } finally {
      setSavingMeeting(false);
    }
  };

  const handlePrepare = async () => {
    if (!id || !contact) return;
    setPreparing(true);
    setBriefing(null);
    try {
      const result = await prepareMeeting(id, contact.name);
      setBriefing(result.briefing);
      setTab('overview');
    } catch (err) {
      showToast(
        err instanceof Error && err.message.includes('not configured')
          ? 'Hindsight is not configured. Running in limited mode.'
          : 'Could not generate preparation brief. Please try again.',
        'error'
      );
    } finally {
      setPreparing(false);
    }
  };

  const handleToggleCommitment = async (commitmentId: string, currentStatus: string) => {
    try {
      await updateCommitment(commitmentId, {
        status: currentStatus === 'completed' ? 'open' : 'completed',
        completed_at: currentStatus === 'completed' ? null : new Date().toISOString(),
      });
      load();
    } catch {
      showToast('Failed to update commitment', 'error');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await updateContact(id, editForm);
      showToast('Contact updated', 'success');
      setEditModalOpen(false);
      load();
    } catch {
      showToast('Failed to update contact', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="skeleton h-8 w-48 rounded mb-6" />
        <div className="skeleton h-32 w-full rounded-2xl mb-6" />
        <div className="skeleton h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <EmptyState
          icon={AlertTriangle}
          title="Contact not found"
          description="This contact may have been deleted."
          action={<Link to="/contacts" className="btn-primary">Back to Contacts</Link>}
        />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Calendar }[] = [
    { id: 'overview', label: 'Overview', icon: ListChecks },
    { id: 'interactions', label: 'Interactions', icon: Calendar },
    { id: 'commitments', label: 'Commitments', icon: CheckSquare },
    { id: 'timeline', label: 'Memory Timeline', icon: Brain },
  ];

  const openCommitments = commitments.filter((c) => c.status === 'open');
  const overdueCommitments = openCommitments.filter((c) => c.due_date && isOverdue(c.due_date));
  const userCommitments = commitments.filter((c) => c.owner === 'user');
  const contactCommitments = commitments.filter((c) => c.owner === 'contact');

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in">
      <Link to="/contacts" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Contacts
      </Link>

      {/* Contact Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold shrink-0">
            {getInitials(contact.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-neutral-900">{contact.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-neutral-500">
              {contact.role && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> {contact.role}
                </span>
              )}
              {contact.company && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> {contact.company}
                </span>
              )}
              {contact.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {contact.email}
                </span>
              )}
            </div>
            <div className="mt-2">
              <span className="badge-primary">{contact.relationship_type}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handlePrepare} disabled={preparing} className="btn-accent">
              {preparing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Prepare Me
            </button>
            <button onClick={() => setMeetingModalOpen(true)} className="btn-secondary">
              <Plus className="w-4 h-4" /> Add Interaction
            </button>
            <button onClick={() => setEditModalOpen(true)} className="btn-ghost">
              <Pencil className="w-4 h-4" /> Edit
            </button>
          </div>
        </div>
      </div>

      {extractionStatus === 'extracting' && (
        <div className="card p-4 mb-6 bg-primary-50/50 border-primary-100 flex items-center gap-3 animate-slide-down">
          <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
          <p className="text-sm text-primary-700">Analyzing meeting notes with AI and retaining memory in Hindsight...</p>
        </div>
      )}

      {/* Preparation Brief */}
      {briefing && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900">Meeting Preparation Brief</h2>
          </div>
          <PreparationBrief briefing={briefing} contactId={contact.id} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-neutral-200 overflow-x-auto scrollbar-thin">
        {tabs.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              tab === tabId
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Relationship Summary</h3>
            {contact.notes ? (
              <p className="text-sm text-neutral-700 leading-relaxed">{contact.notes}</p>
            ) : meetings.length > 0 ? (
              <p className="text-sm text-neutral-700 leading-relaxed">
                You have had {meetings.length} interaction{meetings.length > 1 ? 's' : ''} with {contact.name.split(' ')[0]}.
                {openCommitments.length > 0 && ` There ${openCommitments.length > 1 ? 'are' : 'is'} ${openCommitments.length} open commitment${openCommitments.length > 1 ? 's' : ''}.`}
                {overdueCommitments.length > 0 && ` ${overdueCommitments.length} potentially overdue.`}
              </p>
            ) : (
              <p className="text-sm text-neutral-500">No interactions recorded yet. Add your first meeting to start building context.</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">Open Commitments</h3>
              {openCommitments.length === 0 ? (
                <p className="text-sm text-neutral-500">No open commitments.</p>
              ) : (
                <div className="space-y-2">
                  {openCommitments.slice(0, 5).map((c) => {
                    const status = getCommitmentStatus(c.status, c.due_date);
                    return (
                      <div key={c.id} className="flex items-start gap-2 text-sm">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${status.className.includes('error') ? 'bg-error-500' : status.className.includes('warning') ? 'bg-warning-500' : 'bg-neutral-400'}`} />
                        <span className="text-neutral-700 flex-1">{c.description}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">Recent Discussions</h3>
              {meetings.length === 0 ? (
                <p className="text-sm text-neutral-500">No meetings recorded.</p>
              ) : (
                <div className="space-y-2">
                  {meetings.slice(0, 5).map((m) => (
                    <div key={m.id} className="flex items-start gap-2 text-sm">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-neutral-700 truncate">{m.title}</p>
                        <p className="text-xs text-neutral-400">{formatDate(m.meeting_date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'interactions' && (
        <div className="space-y-4 animate-fade-in">
          {meetings.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No interactions yet"
              description="Record your first meeting to start building context."
              action={<button onClick={() => setMeetingModalOpen(true)} className="btn-primary"><Plus className="w-4 h-4" />Add Interaction</button>}
            />
          ) : (
            meetings.map((meeting) => (
              <div key={meeting.id} className="card p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-neutral-900">{meeting.title}</h3>
                  <span className="text-xs text-neutral-500">{formatDate(meeting.meeting_date)}</span>
                </div>
                {meeting.summary && (
                  <p className="text-sm text-neutral-700 mb-3">{meeting.summary}</p>
                )}
                {meeting.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {meeting.topics.map((topic, i) => (
                      <span key={i} className="badge-neutral">{topic}</span>
                    ))}
                  </div>
                )}
                {meeting.raw_notes && (
                  <details className="group">
                    <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-700">
                      Raw notes
                    </summary>
                    <p className="text-sm text-neutral-600 mt-2 whitespace-pre-wrap rounded-xl bg-neutral-50 p-3">
                      {meeting.raw_notes}
                    </p>
                  </details>
                )}
                {meeting.extraction_status === 'pending' && (
                  <p className="text-xs text-warning-600 mt-2">AI extraction pending</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'commitments' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">My Commitments</h3>
            {userCommitments.length === 0 ? (
              <p className="text-sm text-neutral-500">No commitments recorded.</p>
            ) : (
              <div className="space-y-2">
                {userCommitments.map((c) => {
                  const status = getCommitmentStatus(c.status, c.due_date);
                  return (
                    <div key={c.id} className="card p-4 flex items-center gap-3">
                      <button
                        onClick={() => handleToggleCommitment(c.id, c.status)}
                        className={`w-5 h-5 rounded border-2 shrink-0 transition-all ${
                          c.status === 'completed'
                            ? 'bg-success-500 border-success-500'
                            : 'border-neutral-300 hover:border-primary-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${c.status === 'completed' ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>
                          {c.description}
                        </p>
                        {c.due_date && (
                          <p className="text-xs text-neutral-500 mt-0.5">Due: {formatDate(c.due_date)}</p>
                        )}
                      </div>
                      <span className={status.className}>{status.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Their Commitments</h3>
            {contactCommitments.length === 0 ? (
              <p className="text-sm text-neutral-500">No commitments recorded.</p>
            ) : (
              <div className="space-y-2">
                {contactCommitments.map((c) => {
                  const status = getCommitmentStatus(c.status, c.due_date);
                  return (
                    <div key={c.id} className="card p-4 flex items-center gap-3">
                      <button
                        onClick={() => handleToggleCommitment(c.id, c.status)}
                        className={`w-5 h-5 rounded border-2 shrink-0 transition-all ${
                          c.status === 'completed'
                            ? 'bg-success-500 border-success-500'
                            : 'border-neutral-300 hover:border-primary-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${c.status === 'completed' ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>
                          {c.description}
                        </p>
                        {c.due_date && (
                          <p className="text-xs text-neutral-500 mt-0.5">Due: {formatDate(c.due_date)}</p>
                        )}
                      </div>
                      <span className={status.className}>{status.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'timeline' && (
        <div className="animate-fade-in">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-6">Memory Timeline</h3>
            <MemoryTimeline meetings={meetings} commitments={commitments} />
          </div>
        </div>
      )}

      {/* Add Meeting Modal */}
      <Modal
        open={meetingModalOpen}
        onClose={() => setMeetingModalOpen(false)}
        title="Add Interaction"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveMeeting} className="space-y-4">
          <div>
            <label className="label">Meeting Title *</label>
            <input
              required
              value={meetingForm.title}
              onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
              className="input"
              placeholder="API Integration Discussion"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date *</label>
              <input
                type="date"
                required
                value={meetingForm.meeting_date}
                onChange={(e) => setMeetingForm({ ...meetingForm, meeting_date: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Duration (min)</label>
              <input
                type="number"
                value={meetingForm.duration_minutes}
                onChange={(e) => setMeetingForm({ ...meetingForm, duration_minutes: parseInt(e.target.value) || 60 })}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              value={meetingForm.raw_notes}
              onChange={(e) => setMeetingForm({ ...meetingForm, raw_notes: e.target.value })}
              className="input min-h-[160px] resize-y text-sm"
              placeholder="Rahul said the API documentation would be shared by Friday. I promised to finish the frontend integration after receiving the documentation..."
            />
            <p className="text-xs text-neutral-400 mt-1.5">
              AI will extract commitments, decisions, deadlines, and open questions from these notes.
            </p>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setMeetingModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={savingMeeting} className="btn-primary">
              {savingMeeting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Analyze'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Contact Modal */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Contact"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Company</label>
              <input value={editForm.company} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Role</label>
              <input value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Relationship Type</label>
            <select value={editForm.relationship_type} onChange={(e) => setEditForm({ ...editForm, relationship_type: e.target.value })} className="input">
              {['Contact', 'Project Collaborator', 'Manager', 'Client', 'Vendor', 'Colleague', 'Mentor', 'Direct Report'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className="input min-h-[80px] resize-y" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setEditModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
