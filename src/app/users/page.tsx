import { requireAdmin } from '@/lib/auth';
import { PageHeader } from '@/components/layout/page-header';
import { UserList } from '@/components/users/user-list';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'User Management — Social Media Crawl',
};

export default async function UsersPage() {
  await requireAdmin();

  return (
    <>
      <PageHeader
        title="User Management"
        subtitle="Manage team members, roles, and brand assignments"
      />
      <UserList />
    </>
  );
}
