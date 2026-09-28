import {
  Users,
  MessageSquare,
  Gavel,
  CheckSquare,
  ArrowRightLeft,
  AlertTriangle,
  HelpCircle,
  Lightbulb,
  ListChecks,
  Brain,
  ThumbsUp,
  ThumbsDown,
  Meh,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import type { Briefing } from '@/types';
import { submitFeedback } from '@/lib/api';
import { useToast } from '@/components/Toast';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Section {
  icon: typeof Users;
  title: string;
  items: string[];
  color: string;
}

export default function PreparationBrief({
  briefing,
  contactId,
}: {
  briefing: Briefing;
  contactId: string;
}) {
  const { showToast } = useToast();
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [improvement, setImprovement] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sections: Section[] = [
    { icon: Users, title: 'Relationship Context', items: [briefing.relationshipContext], color: 'text-primary-600 bg-primary-50' },
    { icon: MessageSquare, title: 'Recent Discussions', items: briefing.recentDiscussions, color: 'text-accent-600 bg-accent-50' },
    { icon: Gavel, title: 'Important Decisions', items: briefing.importantDecisions, color: 'text-neutral-700 bg-neutral-100' },
    { icon: CheckSquare, title: 'Your Commitments', items: briefing.yourCommitments, color: 'text-success-600 bg-success-50' },
    { icon: ArrowRightLeft, title: 'Their Commitments', items: briefing.theirCommitments, color: 'text-warning-600 bg-warning-50' },
    { icon: AlertTriangle, title: 'Missed / Overdue Follow-ups', items: briefing.missedFollowUps, color: 'text-error-600 bg-error-50' },
    { icon: HelpCircle, title: 'Open Questions', items: briefing.openQuestions, color: 'text-accent-600 bg-accent-50' },
    { icon: Lightbulb, title: 'Suggested Talking Points', items: briefing.suggestedTalkingPoints, color: 'text-primary-600 bg-primary-50' },
    { icon: ListChecks, title: 'Suggested Agenda', items: briefing.suggestedAgenda, color: 'text-neutral-700 bg-neutral-100' },
    { icon: Brain, title: 'Memory Insights', items: briefing.memoryInsights, color: 'text-primary-600 bg-primary-50' },
  ];

  const handleFeedback = async (rating: string) => {
    setSubmitting(true);
    try {
      await submitFeedback(contactId, briefing, rating, improvement || undefined);
      showToast('Thank you! Your feedback helps me learn.', 'success');
      setFeedbackGiven(true);
      setShowFeedbackForm(false);
    } catch {
      showToast('Could not submit feedback. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 animate-slide-up">
      {briefing.metadata && (
        <div className="flex items-center gap-2 text-xs text-neutral-500 bg-neutral-50 rounded-xl px-4 py-2.5">
          <Sparkles className="w-3.5 h-3.5 text-primary-500" />
          <span>
            Generated from {briefing.metadata.memoriesRecalled} recalled memories
            {briefing.metadata.preferencesApplied > 0 && ` and ${briefing.metadata.preferencesApplied} learned preferences`}
            {briefing.metadata.source === 'fallback' && ' (limited mode — Hindsight not connected)'}
          </span>
        </div>
      )}

      {sections.map(({ icon: Icon, title, items, color }) => {
        if (!items || items.length === 0) return null;
        return (
          <div key={title} className="card p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
            </div>
            <div className="space-y-2 ml-[42px]">
              {items.map((item, i) => (
                <p key={i} className="text-sm text-neutral-700 leading-relaxed">
                  {title === 'Suggested Agenda' ? `${i + 1}. ${item}` : item}
                </p>
              ))}
            </div>
          </div>
        );
      })}

      {/* Feedback */}
      {!feedbackGiven ? (
        <div className="card p-5 bg-gradient-to-br from-primary-50/50 to-accent-50/30 border-primary-100">
          <h3 className="text-sm font-semibold text-neutral-900 mb-1">Was this briefing useful?</h3>
          <p className="text-xs text-neutral-500 mb-3">
            Your feedback helps me learn your preferences for future briefings.
          </p>
          {!showFeedbackForm ? (
            <div className="flex gap-2">
              <button
                onClick={() => handleFeedback('very_useful')}
                disabled={submitting}
                className="btn-secondary text-xs px-3 py-2 hover:border-success-300 hover:text-success-700"
              >
                <ThumbsUp className="w-3.5 h-3.5" /> Very useful
              </button>
              <button
                onClick={() => handleFeedback('useful')}
                disabled={submitting}
                className="btn-secondary text-xs px-3 py-2"
              >
                <Meh className="w-3.5 h-3.5" /> Useful
              </button>
              <button
                onClick={() => setShowFeedbackForm(true)}
                disabled={submitting}
                className="btn-secondary text-xs px-3 py-2 hover:border-error-300 hover:text-error-700"
              >
                <ThumbsDown className="w-3.5 h-3.5" /> Not useful
              </button>
              {submitting && <LoadingSpinner size="sm" />}
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={improvement}
                onChange={(e) => setImprovement(e.target.value)}
                className="input min-h-[60px] resize-y text-sm"
                placeholder="What should I change about the briefing?"
              />
              <div className="flex gap-2">
                <button onClick={() => handleFeedback('not_useful')} disabled={submitting} className="btn-primary text-xs">
                  {submitting ? <LoadingSpinner size="sm" /> : 'Submit Feedback'}
                </button>
                <button onClick={() => setShowFeedbackForm(false)} className="btn-secondary text-xs">Cancel</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card p-5 bg-success-50 border-success-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-success-100 flex items-center justify-center">
            <ThumbsUp className="w-4 h-4 text-success-700" />
          </div>
          <p className="text-sm text-success-800">Feedback recorded. I'll use this to improve future briefings.</p>
        </div>
      )}
    </div>
  );
}
