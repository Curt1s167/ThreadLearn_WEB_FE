'use client';

import { LockKeyhole, Mail, ShieldCheck, Users } from 'lucide-react';

const userActions = [
  ['Create student', Mail],
  ['Verify access', ShieldCheck],
  ['Lock or unlock', LockKeyhole],
];

export default function AdminUsers() {
  return (
    <div className="space-y-6 text-ink">
      <section className="rounded-lg bg-white p-6 sm:p-8">
        <span className="inline-flex rounded-full bg-[#f5d0fe] px-3 py-1 text-xs font-medium text-black">
          Admin · UC10-UC13
        </span>
        <h1 className="mt-5 text-4xl font-light tracking-tight">User management</h1>
        <p className="mt-3 max-w-2xl text-black/60">
          Placeholder surface for student account CRUD and access controls. Keep this route available while the full user table is integrated.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {userActions.map(([label, Icon]) => (
          <div key={label as string} className="rounded-lg border border-black/10 bg-white p-5">
            <Icon size={22} />
            <p className="mt-4 font-semibold">{label as string}</p>
            <p className="mt-2 text-sm text-black/55">Pending backend UI wiring.</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-[#d9f99d] p-5">
        <Users size={22} />
        <p className="mt-3 font-semibold">Admin dashboard already reads the real student summary.</p>
      </div>
    </div>
  );
}
