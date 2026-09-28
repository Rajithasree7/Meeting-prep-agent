import { useEffect, useState } from 'react';
import { User, Mail, Brain, Server, CheckCircle, XCircle, Loader2, RefreshCw, Database, Cloud, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getHealthStatus } from '@/lib/api';
import { seedDemoData } from '@/lib/seedDemo';
import { useToast } from '@/components/Toast';
import type { HealthStatus } from '@/types';

export default function Settings() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const loadHealth = async () => {
    setLoading(true);
    try {
      const status = await getHealthStatus();
      setHealth(status);
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const userName = (user?.user_metadata as { name?: string } | null)?.name ?? '';

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const result = await seedDemoData();
      showToast(result.message, result.success ? 'success' : 'error');
    } catch {
      showToast('Failed to load demo data', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const services = [
    {
      name: 'Database (Supabase)',
      icon: Database,
      status: health?.database,
      configured: 'connected',
      label: 'Stores contacts, meetings, commitments, and preferences',
    },
    {
      name: 'Hindsight Memory',
      icon: Brain,
      status: health?.hindsight,
      configured: 'connected',
      label: 'Persistent agent memory — retains and recalls interaction context',
    },
    {
      name: 'Grok / xAI',
      icon: Cloud,
      status: health?.ai,
      configured: 'configured',
      label: 'AI reasoning for meeting extraction and briefing generation',
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Settings</h1>

      {/* Profile */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-neutral-500" />
          <h2 className="text-lg font-semibold text-neutral-900">Profile</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-neutral-900">{userName}</p>
            <p className="text-sm text-neutral-500 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5" /> {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-neutral-500" />
            <h2 className="text-lg font-semibold text-neutral-900">System Status</h2>
          </div>
          <button
            onClick={loadHealth}
            disabled={loading}
            className="btn-ghost text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
        </div>

        <div className="space-y-3">
          {services.map((service) => {
            const Icon = service.icon;
            const isUp = service.status === service.configured;
            const isNotConfigured = service.status === 'not_configured';
            return (
              <div
                key={service.name}
                className={`flex items-center gap-4 p-4 rounded-xl border ${
                  isUp
                    ? 'border-success-200 bg-success-50/50'
                    : isNotConfigured
                    ? 'border-warning-200 bg-warning-50/50'
                    : 'border-neutral-200 bg-neutral-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  isUp ? 'bg-success-100 text-success-700' : isNotConfigured ? 'bg-warning-100 text-warning-700' : 'bg-neutral-200 text-neutral-500'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900">{service.name}</p>
                  <p className="text-xs text-neutral-500">{service.label}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {loading ? (
                    <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
                  ) : isUp ? (
                    <span className="badge-success">
                      <CheckCircle className="w-3 h-3" /> Connected
                    </span>
                  ) : isNotConfigured ? (
                    <span className="badge-warning">
                      <XCircle className="w-3 h-3" /> Not Configured
                    </span>
                  ) : (
                    <span className="badge-neutral">
                      <XCircle className="w-3 h-3" /> Disconnected
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {health?.hindsight === 'not_configured' && (
          <div className="mt-4 p-4 rounded-xl bg-warning-50 border border-warning-200">
            <p className="text-sm text-warning-800">
              <strong>Hindsight is not configured.</strong> The app runs in limited mode — meetings are still saved and AI extraction works,
              but the agent cannot retain or recall persistent memories. Add HINDSIGHT_API_KEY and HINDSIGHT_BASE_URL as edge function secrets to enable full memory.
            </p>
          </div>
        )}
      </div>

      {/* Demo Data */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-accent-600" />
          <h2 className="text-lg font-semibold text-neutral-900">Demo Data</h2>
        </div>
        <p className="text-sm text-neutral-600 mb-4">
          Load realistic sample contacts, meetings, and commitments to see how the memory system works. This creates 3 contacts with multiple interactions and tracked commitments.
        </p>
        <button onClick={handleSeedDemo} disabled={seeding} className="btn-accent">
          {seeding ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Zap className="w-4 h-4" /> Load Demo Data</>}
        </button>
      </div>

      {/* About */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-3">About Meeting Prep Agent</h2>
        <div className="space-y-3 text-sm text-neutral-600">
          <p>
            Meeting Prep Agent uses <strong>Hindsight</strong> for persistent AI memory and <strong>Grok/xAI</strong> for reasoning.
            MongoDB/Supabase stores application records (contacts, meetings, commitments), while Hindsight stores the agent's long-term memory.
          </p>
          <div className="flex items-start gap-2 p-3 rounded-xl bg-primary-50">
            <Brain className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
            <p className="text-xs text-primary-800">
              <strong>Why Hindsight?</strong> MongoDB stores application data. Hindsight provides persistent memory that allows the agent
              to recall and use information from previous interactions — enabling genuinely contextual meeting preparation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
