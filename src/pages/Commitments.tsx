import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, AlertTriangle, Clock, ArrowRight, User, Users } from 'lucide-react';
import { fetchCommitments, updateCommitment } from '@/lib/commitments';
import { fetchContacts } from '@/lib/contacts';
import { formatDate, getCommitmentStatus, isOverdue, getInitials } from '@/lib/utils';
import type { Commitment, Contact } from '@/types';
import EmptyState from '@/components/EmptyState';
import { ListSkeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';

type Filter = 'all' | 'open' | 'overdue' | 'completed';

export default function Commitments() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  const load = async () => {
    setLoading(true);
    try {
      const [c, contactsData] = await Promise.all([fetchCommitments(), fetchContacts()]);
      setCommitments(c);
      setContacts(contactsData);
    } catch {
      showToast('Failed to load commitments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const contactMap = new Map(contacts.map((c) => [c.id, c]));

  const toggleComplete = async (id: string, status: string) => {
    try {
      await updateCommitment(id, {
        status: status === 'completed' ? 'open' : 'completed',
        completed_at: status === 'completed' ? null : new Date().toISOString(),
      });
      load();
    } catch {
      showToast('Failed to update commitment', 'error');
    }
  };

  const filtered = commitments.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'open') return c.status === 'open';
    if (filter === 'completed') return c.status === 'completed';
    if (filter === 'overdue') return c.status === 'open' && c.due_date && isOverdue(c.due_date);
    return true;
  });

  const counts = {
    all: commitments.length,
    open: commitments.filter((c) => c.status === 'open').length,
    overdue: commitments.filter((c) => c.status === 'open' && c.due_date && isOverdue(c.due_date)).length,
    completed: commitments.filter((c) => c.status === 'completed').length,
  };

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'open', label: 'Open', count: counts.open },
    { id: 'overdue', label: 'Overdue', count: counts.overdue },
    { id: 'completed', label: 'Completed', count: counts.completed },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Commitments</h1>
        <p className="text-neutral-500 mt-1">Track promises made by you and your contacts</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-thin">
        {filters.map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              filter === id
                ? 'bg-primary-600 text-white'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {loading ? (
        <ListSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No commitments found"
          description="Commitments are automatically extracted from meeting notes by AI, or you can add them manually from a contact's page."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((commitment) => {
            const contact = contactMap.get(commitment.contact_id);
            const status = getCommitmentStatus(commitment.status, commitment.due_date);
            const overdue = commitment.status === 'open' && commitment.due_date && isOverdue(commitment.due_date);
            return (
              <div
                key={commitment.id}
                className={`card p-4 flex items-center gap-4 ${overdue ? 'border-error-200 bg-error-50/30' : ''}`}
              >
                <button
                  onClick={() => toggleComplete(commitment.id, commitment.status)}
                  className={`w-6 h-6 rounded-lg border-2 shrink-0 transition-all flex items-center justify-center ${
                    commitment.status === 'completed'
                      ? 'bg-success-500 border-success-500'
                      : 'border-neutral-300 hover:border-primary-500'
                  }`}
                >
                  {commitment.status === 'completed' && <CheckSquare className="w-4 h-4 text-white" />}
                </button>

                <div
                  onClick={() => navigate(`/contacts/${commitment.contact_id}`)}
                  className="flex-1 min-w-0 cursor-pointer"
                >
                  <p className={`text-sm font-medium ${commitment.status === 'completed' ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>
                    {commitment.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {contact && (
                      <span className="flex items-center gap-1 text-xs text-neutral-500">
                        <div className="w-4 h-4 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[9px] font-semibold">
                          {getInitials(contact.name)}
                        </div>
                        {contact.name}
                      </span>
                    )}
                    <span className="text-xs text-neutral-400">·</span>
                    <span className={`text-xs flex items-center gap-1 ${commitment.owner === 'user' ? 'text-primary-600' : 'text-warning-600'}`}>
                      {commitment.owner === 'user' ? <User className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                      {commitment.owner === 'user' ? 'You' : 'They'} promised
                    </span>
                    {commitment.due_date && (
                      <>
                        <span className="text-xs text-neutral-400">·</span>
                        <span className={`text-xs flex items-center gap-1 ${overdue ? 'text-error-600' : 'text-neutral-500'}`}>
                          <Clock className="w-3 h-3" /> {formatDate(commitment.due_date)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <span className={status.className}>{status.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
