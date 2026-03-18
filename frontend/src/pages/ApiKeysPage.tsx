import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantApi } from '../services/api';
import { ApiKey } from '../types';
import { PageHeader, LoadingState, ErrorState, Modal, InlineAlert } from '../components/ui';
import { getErrorMessage } from '../services/apiClient';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

export const ApiKeysPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [createError, setCreateError] = useState('');
  const [copied, setCopied] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => tenantApi.getApiKeys().then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => tenantApi.createApiKey(name),
    onSuccess: (res) => {
      setCreatedKey(res.data.data.rawKey);
      setNewKeyName('');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (err) => setCreateError(getErrorMessage(err)),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => tenantApi.revokeApiKey(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
  });

  const handleCreate = () => {
    if (!newKeyName.trim()) return;
    setCreateError('');
    createMutation.mutate(newKeyName.trim());
  };

  const handleCopy = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const keys = data ?? [];
  const activeKeys = keys.filter((k) => k.isActive);
  const revokedKeys = keys.filter((k) => !k.isActive);

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="API Keys"
        description="Manage keys for log ingestion via the REST API"
        action={
          isAdmin ? (
            <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
              + New Key
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Ingestion info box */}
        <div className="card p-4 border-accent/20 bg-accent/5">
          <p className="text-sm font-semibold text-white mb-2">📡 Log Ingestion Endpoint</p>
          <code className="text-xs text-accent font-mono block bg-surface-2 px-3 py-2 rounded border border-border">
            POST /api/v1/logs/ingest
          </code>
          <p className="text-xs text-gray-500 mt-2">
            Include your API key in the <code className="text-accent">X-API-Key</code> header.
            Rate limit: 1,000 logs/minute per tenant.
          </p>
          <pre className="text-xs text-gray-400 bg-surface-2 rounded p-3 mt-3 border border-border overflow-x-auto">{`curl -X POST https://your-host/api/v1/logs/ingest \\
  -H "X-API-Key: lp_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"message":"App started","level":"info","source":"api"}'`}</pre>
        </div>

        {isLoading && <LoadingState />}
        {isError && <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />}

        {/* Active keys */}
        {activeKeys.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Active Keys ({activeKeys.length})
            </h3>
            <div className="space-y-2">
              {activeKeys.map((key) => (
                <ApiKeyCard
                  key={key.id}
                  apiKey={key}
                  isAdmin={isAdmin}
                  onRevoke={() => {
                    if (confirm(`Revoke "${key.name}"? This cannot be undone.`)) {
                      revokeMutation.mutate(key.id);
                    }
                  }}
                  isRevoking={revokeMutation.isPending}
                />
              ))}
            </div>
          </div>
        )}

        {/* Revoked keys */}
        {revokedKeys.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Revoked Keys ({revokedKeys.length})
            </h3>
            <div className="space-y-2 opacity-50">
              {revokedKeys.map((key) => (
                <ApiKeyCard key={key.id} apiKey={key} isAdmin={false} />
              ))}
            </div>
          </div>
        )}

        {keys.length === 0 && !isLoading && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-3">🔑</p>
            <p className="font-medium text-white">No API keys yet</p>
            <p className="text-sm mt-1">Create one to start ingesting logs</p>
          </div>
        )}
      </div>

      {/* Create key modal */}
      <Modal open={showCreate && !createdKey} onClose={() => { setShowCreate(false); setNewKeyName(''); setCreateError(''); }} title="Create API Key">
        <div className="space-y-4">
          {createError && <InlineAlert type="error" message={createError} />}
          <div>
            <label className="label">Key Name</label>
            <input
              className="input"
              placeholder="e.g. Production Server, CI/CD Pipeline"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleCreate}
              className="btn-primary flex-1"
              disabled={!newKeyName.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Key'}
            </button>
            <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1">
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Show new key modal */}
      <Modal open={!!createdKey} onClose={() => { setCreatedKey(null); setShowCreate(false); }} title="🔑 Your New API Key">
        <div className="space-y-4">
          <InlineAlert type="info" message="Copy this key now. It will never be shown again." />
          <div>
            <label className="label">API Key</label>
            <div className="flex gap-2">
              <input className="input font-mono text-xs" value={createdKey || ''} readOnly />
              <button onClick={handleCopy} className="btn-primary shrink-0 text-sm px-3">
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
          </div>
          <button onClick={() => { setCreatedKey(null); setShowCreate(false); }} className="btn-primary w-full">
            Done
          </button>
        </div>
      </Modal>
    </div>
  );
};

const ApiKeyCard = ({ apiKey, isAdmin, onRevoke, isRevoking }: {
  apiKey: ApiKey; isAdmin: boolean; onRevoke?: () => void; isRevoking?: boolean;
}) => (
  <div className={`card p-4 flex items-center gap-4 ${apiKey.isActive ? '' : 'opacity-60'}`}>
    <div className={`w-2 h-2 rounded-full shrink-0 ${apiKey.isActive ? 'bg-emerald-400' : 'bg-gray-600'}`} />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="font-medium text-white text-sm">{apiKey.name}</span>
        {!apiKey.isActive && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">Revoked</span>
        )}
      </div>
      <div className="flex items-center gap-3 mt-1">
        <code className="text-xs text-gray-500 font-mono">{apiKey.keyPrefix}•••••••••••••••</code>
        {apiKey.lastUsedAt && (
          <span className="text-xs text-gray-600">
            Last used {format(new Date(apiKey.lastUsedAt), 'MMM d, HH:mm')}
          </span>
        )}
        <span className="text-xs text-gray-600">
          Created {format(new Date(apiKey.createdAt), 'MMM d, yyyy')}
        </span>
      </div>
    </div>
    {isAdmin && apiKey.isActive && onRevoke && (
      <button onClick={onRevoke} disabled={isRevoking} className="btn-danger">
        Revoke
      </button>
    )}
  </div>
);
