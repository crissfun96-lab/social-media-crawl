'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Brand, UserRole } from '@/types/database';

interface SafeUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: UserRole;
  readonly assigned_brands: readonly Brand[];
  readonly assigned_creators: readonly string[];
  readonly created_at: string;
  readonly updated_at: string;
}

const ALL_BRANDS: readonly { readonly value: Brand; readonly label: string }[] = [
  { value: 'songhwa', label: 'Songhwa' },
  { value: 'byondwalls', label: 'Byond Walls' },
  { value: 'hwc_coffee', label: 'HWC Coffee' },
  { value: 'decore', label: 'De Core' },
] as const;

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-amber-900 text-amber-300',
  staff: 'bg-blue-900 text-blue-300',
};

function BrandAssignModal({
  user,
  onClose,
  onSave,
}: {
  readonly user: SafeUser;
  readonly onClose: () => void;
  readonly onSave: (userId: string, brands: Brand[]) => Promise<void>;
}) {
  const [selected, setSelected] = useState<readonly Brand[]>(user.assigned_brands);
  const [saving, setSaving] = useState(false);

  const toggleBrand = useCallback((brand: Brand) => {
    setSelected(prev =>
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await onSave(user.id, [...selected]);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-zinc-100 mb-1">Assign Brands</h3>
        <p className="text-sm text-zinc-400 mb-4">Select brands for {user.name}</p>

        <div className="space-y-2 mb-6">
          {ALL_BRANDS.map(brand => (
            <label
              key={brand.value}
              className="flex items-center gap-3 p-3 rounded-lg border border-zinc-700 bg-zinc-800 cursor-pointer
                hover:border-indigo-500/50 transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(brand.value)}
                onChange={() => toggleBrand(brand.value)}
                className="rounded border-zinc-600 bg-zinc-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-zinc-200">{brand.label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CreatorAssignModal({
  user,
  onClose,
  onSave,
}: {
  readonly user: SafeUser;
  readonly onClose: () => void;
  readonly onSave: (userId: string, creators: string[]) => Promise<void>;
}) {
  const [input, setInput] = useState(user.assigned_creators.join(', '));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const creators = input
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    await onSave(user.id, creators);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-zinc-100 mb-1">Assign Creators</h3>
        <p className="text-sm text-zinc-400 mb-4">Enter creator IDs for {user.name} (comma-separated)</p>

        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100
            placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-4"
          placeholder="creator-id-1, creator-id-2"
        />

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function UserList() {
  const [users, setUsers] = useState<readonly SafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brandModal, setBrandModal] = useState<SafeUser | null>(null);
  const [creatorModal, setCreatorModal] = useState<SafeUser | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      } else {
        setError(data.error ?? 'Failed to load users');
      }
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUser = useCallback(async (userId: string, updates: Record<string, unknown>) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (data.success) {
      await fetchUsers();
    }
  }, [fetchUsers]);

  const toggleRole = useCallback(async (user: SafeUser) => {
    const newRole: UserRole = user.role === 'admin' ? 'staff' : 'admin';
    await updateUser(user.id, { role: newRole });
  }, [updateUser]);

  const saveBrands = useCallback(async (userId: string, brands: Brand[]) => {
    await updateUser(userId, { assigned_brands: brands });
  }, [updateUser]);

  const saveCreators = useCallback(async (userId: string, creators: string[]) => {
    await updateUser(userId, { assigned_creators: creators });
  }, [updateUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-3 text-sm text-red-300">
        {error}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-zinc-400 text-sm">No registered users yet.</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {users.map(user => (
          <Card key={user.id}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-zinc-100 truncate">{user.name}</h3>
                  <Badge className={ROLE_COLORS[user.role]}>{user.role}</Badge>
                </div>
                <p className="text-xs text-zinc-400 truncate">{user.email}</p>

                {user.assigned_brands.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {user.assigned_brands.map(brand => (
                      <Badge key={brand} className="bg-indigo-900/50 text-indigo-300">
                        {ALL_BRANDS.find(b => b.value === brand)?.label ?? brand}
                      </Badge>
                    ))}
                  </div>
                )}

                {user.assigned_creators.length > 0 && (
                  <p className="text-xs text-zinc-500 mt-1">
                    {user.assigned_creators.length} creator{user.assigned_creators.length !== 1 ? 's' : ''} assigned
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleRole(user)}
                >
                  {user.role === 'admin' ? 'Demote' : 'Promote'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setBrandModal(user)}
                >
                  Brands
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCreatorModal(user)}
                >
                  Creators
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {brandModal && (
        <BrandAssignModal
          user={brandModal}
          onClose={() => setBrandModal(null)}
          onSave={saveBrands}
        />
      )}

      {creatorModal && (
        <CreatorAssignModal
          user={creatorModal}
          onClose={() => setCreatorModal(null)}
          onSave={saveCreators}
        />
      )}
    </>
  );
}
