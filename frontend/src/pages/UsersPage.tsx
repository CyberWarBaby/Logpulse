import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../services/api';
import { User } from '../types';
import { PageHeader, LoadingState, ErrorState, InlineAlert } from '../components/ui';
import { getErrorMessage } from '../services/apiClient';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const isAdmin = currentUser?.role === 'ADMIN';

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers().then((r) => r.data.data),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      usersApi.updateRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setFeedback({ type: 'success', message: 'Role updated successfully' });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err) => setFeedback({ type: 'error', message: getErrorMessage(err) }),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => usersApi.removeUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setFeedback({ type: 'success', message: 'User removed from workspace' });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err) => setFeedback({ type: 'error', message: getErrorMessage(err) }),
  });

  const users = data ?? [];

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Team"
        description="Manage workspace members and their access levels"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {feedback && <InlineAlert type={feedback.type} message={feedback.message} />}
        {isLoading && <LoadingState />}
        {isError && <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />}

        {/* Role info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4 border-accent/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">👑</span>
              <span className="font-semibold text-white text-sm">Admin</span>
            </div>
            <p className="text-xs text-gray-500">Full access: manage users, API keys, view all logs and analytics.</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">👤</span>
              <span className="font-semibold text-white text-sm">Member</span>
            </div>
            <p className="text-xs text-gray-500">Read-only access to logs, analytics, and dashboard.</p>
          </div>
        </div>

        {/* Users table */}
        {users.length > 0 && (
          <div className="card overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-surface-2 text-gray-500 text-xs uppercase tracking-wider">
              <span className="flex-1">Member</span>
              <span className="w-24 shrink-0">Role</span>
              <span className="w-32 shrink-0">Joined</span>
              {isAdmin && <span className="w-28 shrink-0">Actions</span>}
            </div>

            {users.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                isSelf={u.id === currentUser?.id}
                isAdmin={isAdmin}
                onRoleChange={(role) => roleMutation.mutate({ userId: u.id, role })}
                onRemove={() => {
                  if (confirm(`Remove ${u.name} from the workspace?`)) {
                    removeMutation.mutate(u.id);
                  }
                }}
                isLoading={roleMutation.isPending || removeMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const UserRow = ({ user, isSelf, isAdmin, onRoleChange, onRemove, isLoading }: {
  user: User & { createdAt?: string; isActive?: boolean };
  isSelf: boolean;
  isAdmin: boolean;
  onRoleChange: (role: string) => void;
  onRemove: () => void;
  isLoading: boolean;
}) => (
  <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle hover:bg-surface-2/50 transition-colors">
    {/* Avatar + info */}
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
        isSelf ? 'bg-accent/20 border border-accent/30 text-accent' : 'bg-surface-3 text-gray-300'
      }`}>
        {user.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">{user.name}</span>
          {isSelf && <span className="text-xs text-gray-600">(you)</span>}
        </div>
        <span className="text-xs text-gray-500 truncate">{user.email}</span>
      </div>
    </div>

    {/* Role badge/selector */}
    <div className="w-24 shrink-0">
      {isAdmin && !isSelf ? (
        <select
          className="text-xs bg-surface-2 border border-border text-white rounded px-2 py-1 w-full"
          value={user.role}
          onChange={(e) => onRoleChange(e.target.value)}
          disabled={isLoading}
        >
          <option value="ADMIN">Admin</option>
          <option value="MEMBER">Member</option>
        </select>
      ) : (
        <span className={`text-xs px-2 py-1 rounded-full border ${
          user.role === 'ADMIN'
            ? 'bg-accent/10 text-accent border-accent/20'
            : 'bg-surface-2 text-gray-400 border-border'
        }`}>
          {user.role === 'ADMIN' ? '👑 Admin' : '👤 Member'}
        </span>
      )}
    </div>

    {/* Joined date */}
    <span className="w-32 shrink-0 text-xs text-gray-500">
      {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : '—'}
    </span>

    {/* Actions */}
    {isAdmin && (
      <div className="w-28 shrink-0">
        {!isSelf && (
          <button onClick={onRemove} disabled={isLoading} className="btn-danger">
            Remove
          </button>
        )}
      </div>
    )}
  </div>
);
