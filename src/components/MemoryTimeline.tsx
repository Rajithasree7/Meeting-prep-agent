import { formatDate } from '@/lib/utils';
import type { Meeting, Commitment } from '@/types';
import { Calendar, CheckSquare, AlertTriangle, Clock } from 'lucide-react';

interface TimelineEvent {
  date: string;
  title: string;
  description?: string;
  type: 'meeting' | 'commitment' | 'deadline' | 'overdue';
}

export default function MemoryTimeline({
  meetings,
  commitments,
}: {
  meetings: Meeting[];
  commitments: Commitment[];
}) {
  const events: TimelineEvent[] = [];

  meetings.forEach((m) => {
    events.push({
      date: m.meeting_date,
      title: m.title,
      description: m.summary ?? undefined,
      type: 'meeting',
    });
  });

  commitments.forEach((c) => {
    if (c.due_date) {
      const isOverdue = c.status === 'open' && new Date(c.due_date) < new Date();
      events.push({
        date: c.due_date,
        title: c.description,
        description: `${c.owner === 'user' ? 'You' : 'They'} promised · ${c.status === 'completed' ? 'Completed' : isOverdue ? 'Potentially overdue' : 'Pending'}`,
        type: c.status === 'completed' ? 'deadline' : isOverdue ? 'overdue' : 'commitment',
      });
    }
  });

  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500 text-sm">
        No timeline events yet. Add interactions to see the memory timeline.
      </div>
    );
  }

  const typeConfig = {
    meeting: { icon: Calendar, color: 'text-primary-600 bg-primary-100', line: 'bg-primary-200' },
    commitment: { icon: CheckSquare, color: 'text-warning-600 bg-warning-100', line: 'bg-warning-200' },
    deadline: { icon: Clock, color: 'text-success-600 bg-success-100', line: 'bg-success-200' },
    overdue: { icon: AlertTriangle, color: 'text-error-600 bg-error-100', line: 'bg-error-200' },
  };

  return (
    <div className="relative pl-8">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-neutral-200" />

      <div className="space-y-6">
        {events.map((event, i) => {
          const config = typeConfig[event.type];
          const Icon = config.icon;
          return (
            <div key={i} className="relative animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
              {/* Node */}
              <div className={`absolute -left-8 w-8 h-8 rounded-full ${config.color} flex items-center justify-center ring-4 ring-white`}>
                <Icon className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="card p-4 ml-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-neutral-500">{formatDate(event.date)}</p>
                  {event.type === 'overdue' && <span className="badge-error text-[10px]">Overdue</span>}
                  {event.type === 'deadline' && <span className="badge-success text-[10px]">Completed</span>}
                  {event.type === 'meeting' && <span className="badge-primary text-[10px]">Meeting</span>}
                  {event.type === 'commitment' && <span className="badge-warning text-[10px]">Commitment</span>}
                </div>
                <p className="text-sm font-medium text-neutral-900">{event.title}</p>
                {event.description && (
                  <p className="text-sm text-neutral-500 mt-1">{event.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
