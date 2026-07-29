import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/errors';
import { useAuditQuery, useSettingsQuery, useUsersQuery } from '../api/hooks';
import { settingsApi } from '../api/settings';
import { AsyncState } from '../components/AsyncState';
import { StatGrid } from '../components/ui';
import { Icon } from '../icons';
import { useStore } from '../store';

export function AdminDashboard() {
  const { cn } = useStore();
  const users = useUsersQuery();
  const audit = useAuditQuery();
  const active = users.data?.items.filter((user) => user.status === 'ACTIVE').length ?? 0;
  const locked = users.data?.items.filter((user) => user.status === 'LOCKED').length ?? 0;
  const stats: [string, string, string, string, string][] = [
    [
      'users',
      cn('Total Users', 'إجمالي المستخدمين'),
      String(users.data?.total ?? '—'),
      cn('all accounts', 'كل الحسابات'),
      '#FBCA89',
    ],
    ['check', cn('Active Accounts', 'الحسابات النشطة'), String(active), cn('loaded scope', 'النطاق المحمل'), '#10B981'],
    [
      'shield',
      cn('Locked Accounts', 'الحسابات المقفلة'),
      String(locked),
      cn('requires review', 'تتطلب مراجعة'),
      '#EF4444',
    ],
    [
      'layers',
      cn('Audit Events', 'أحداث التدقيق'),
      String(audit.data?.total ?? '—'),
      cn('append-only log', 'سجل للإضافة فقط'),
      '#3B82F6',
    ],
  ];
  return (
    <AsyncState loading={users.isLoading || audit.isLoading} error={users.error ?? audit.error}>
      <div className="system-status">
        <span />
        <div>
          <strong>{cn('SUMS API connected', 'واجهة SUMS متصلة')}</strong>
          <small>{cn('Database-backed administration is operational.', 'الإدارة المتصلة بقاعدة البيانات تعمل.')}</small>
        </div>
      </div>
      <StatGrid items={stats} />
      <div className="dark-panel">
        <h3>{cn('Recent audited activity', 'أحدث النشاطات المدققة')}</h3>
        {audit.data?.items.slice(0, 8).map((entry) => (
          <div key={entry.id} className="audit-row">
            <span className="badge">{entry.action}</span>
            <div>
              <strong>{entry.entityType}</strong>
              <small>
                {new Date(entry.occurredAt).toLocaleString()} · {entry.actorRole ?? 'SYSTEM'}
              </small>
            </div>
          </div>
        ))}
      </div>
    </AsyncState>
  );
}

export function AdminUsers() {
  const { L, ar, cn } = useStore();
  const [search, setSearch] = useState('');
  const users = useUsersQuery(search);
  return (
    <div className="dark-panel table-panel">
      <div className="search-row">
        <Icon name="search" size={18} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={L.searchStudents} />
        <button
          className="admin-action"
          disabled
          title={cn(
            'Use POST /users or the forthcoming full creation wizard',
            'استخدم POST /users أو معالج الإنشاء القادم',
          )}
        >
          + {L.createUser}
        </button>
      </div>
      <AsyncState loading={users.isLoading} error={users.error} empty={!users.data?.items.length}>
        <table>
          <thead>
            <tr>
              <th>{L.thName}</th>
              <th>{L.email}</th>
              <th>{L.roleCol}</th>
              <th>{L.lastLogin}</th>
              <th>{L.thStatus}</th>
            </tr>
          </thead>
          <tbody>
            {users.data?.items.map((user) => (
              <tr key={user.id}>
                <td>
                  <strong>
                    {user.firstNameEn} {user.lastNameEn}
                  </strong>
                  <small>{user.universityId ?? user.employeeId ?? user.id.slice(0, 8)}</small>
                </td>
                <td>{user.email}</td>
                <td>{user.userRoles.map((entry) => (ar ? entry.role.nameAr : entry.role.nameEn)).join(', ')}</td>
                <td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—'}</td>
                <td>
                  <span className="badge">{user.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AsyncState>
    </div>
  );
}

export function AdminRoles() {
  const { L, ar, cn } = useStore();
  const users = useUsersQuery();
  const roles = useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>();
    for (const user of users.data?.items ?? [])
      for (const assignment of user.userRoles) {
        const current = counts.get(assignment.role.key);
        counts.set(assignment.role.key, {
          name: ar ? assignment.role.nameAr : assignment.role.nameEn,
          count: (current?.count ?? 0) + 1,
        });
      }
    return [...counts.entries()];
  }, [ar, users.data]);
  return (
    <AsyncState loading={users.isLoading} error={users.error} empty={!roles.length}>
      <div className="dark-panel">
        <div className="row-between">
          <h3>{L.m_roles}</h3>
          <button
            className="admin-action"
            disabled
            title={cn(
              'Role assignment is available through PUT /users/:id/roles',
              'إسناد الأدوار متاح عبر PUT /users/:id/roles',
            )}
          >
            {L.applyChanges}
          </button>
        </div>
        {roles.map(([key, role]) => (
          <div className="record-row" key={key}>
            <div>
              <strong>{role.name}</strong>
              <small>{key}</small>
            </div>
            <span>
              {role.count} {L.m_users}
            </span>
          </div>
        ))}
      </div>
    </AsyncState>
  );
}

export function AdminAudit() {
  const { L, cn } = useStore();
  const audit = useAuditQuery();
  return (
    <AsyncState loading={audit.isLoading} error={audit.error} empty={!audit.data?.items.length}>
      <div className="dark-panel table-panel">
        <div className="row-between">
          <h3>{L.m_audit}</h3>
          <button
            className="admin-action"
            disabled
            title={cn(
              'Audit export remains disabled until the immutable export endpoint is approved.',
              'تصدير التدقيق معطل حتى اعتماد واجهة التصدير غير القابلة للتعديل.',
            )}
          >
            {L.exportRow}
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>{L.semesterLabel}</th>
              <th>{L.ipCol}</th>
              <th>{L.actionCol}</th>
              <th>{L.resourceCol}</th>
              <th>{L.userCol}</th>
            </tr>
          </thead>
          <tbody>
            {audit.data?.items.map((entry) => (
              <tr key={entry.id}>
                <td>{new Date(entry.occurredAt).toLocaleString()}</td>
                <td>{entry.ipAddress ?? '—'}</td>
                <td>
                  <span className="badge">{entry.action}</span>
                </td>
                <td>
                  {entry.entityType}
                  {entry.entityId ? ` · ${entry.entityId.slice(0, 8)}` : ''}
                </td>
                <td>{entry.actorRole ?? 'SYSTEM'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AsyncState>
  );
}

export function AdminSettings() {
  const { L, cn, toast } = useStore();
  const settings = useSettingsQuery();
  const client = useQueryClient();
  const update = useMutation({
    mutationFn: ({ key, value, reason }: { key: string; value: Record<string, unknown>; reason: string }) =>
      settingsApi.update(key, value, reason),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['settings'] });
      toast(cn('Setting updated.', 'تم تحديث الإعداد.'));
    },
    onError: (error) => toast(error instanceof ApiError ? error.code : 'REQUEST_FAILED'),
  });
  const edit = (key: string, current: unknown) => {
    const raw = window.prompt(
      cn('Enter a JSON object for this setting:', 'أدخل كائن JSON لهذا الإعداد:'),
      JSON.stringify(current, null, 2),
    );
    if (!raw) return;
    const reason = window.prompt(cn('Reason for this audited change:', 'سبب هذا التغيير المدقق:'));
    if (!reason) return;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
      update.mutate({ key, value: parsed as Record<string, unknown>, reason });
    } catch {
      toast(cn('Value must be a JSON object.', 'يجب أن تكون القيمة كائن JSON.'));
    }
  };
  return (
    <AsyncState loading={settings.isLoading} error={settings.error} empty={!settings.data?.length}>
      <div className="dark-panel">
        <h3>{L.m_settings}</h3>
        {settings.data?.map((setting) => (
          <div key={setting.id} className="setting-row">
            <div>
              <strong>{setting.key}</strong>
              <pre>{JSON.stringify(setting.value, null, 2)}</pre>
            </div>
            <button
              className="admin-action"
              disabled={update.isPending}
              onClick={() => edit(setting.key, setting.value)}
            >
              {L.applyChanges}
            </button>
          </div>
        ))}
      </div>
    </AsyncState>
  );
}
