import { ExternalLink } from 'lucide-react';
import { Button } from '@openregistro/ui';

const DEMO_URL = 'https://openregistro-demo.vercel.app';
const DEMO_PASSWORD = 'DemoPassword123!';

const DEMO_ACCOUNTS = [
  {
    role: 'School admin',
    email: 'admin@demo.openregistro.local',
    description: 'School records, accounts, the audit log, and term evaluations.',
  },
  {
    role: 'Teacher',
    email: 'teacher@demo.openregistro.local',
    description: 'The class register, gradebook, homework, and attendance.',
  },
  {
    role: 'Student',
    email: 'student1@demo.openregistro.local',
    description: 'Read-only grades, homework, attendance, and announcements.',
  },
  {
    role: 'Guardian',
    email: 'guardian1@demo.openregistro.local',
    description: "A child's grades and attendance, plus absence justifications.",
  },
];

export function DemoSection() {
  return (
    <section id="demo" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 max-w-2xl">
          <h2 className="font-display text-3xl font-semibold">Try the live demo</h2>
          <p className="mt-3 text-muted-foreground">
            This is the real application, not a mockup - a running instance seeded with fictional
            data, with one login per role so you can see what each kind of user actually sees. It is
            a shared public demo: data entered here is visible to other visitors and gets reset
            periodically, so do not use it for anything real.
          </p>
        </div>

        <div className="mb-8">
          <Button asChild size="lg">
            <a href={DEMO_URL} target="_blank" rel="noreferrer">
              Open the demo
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Password</th>
                <th className="px-4 py-3 font-medium">What to look at</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_ACCOUNTS.map((account) => (
                <tr key={account.email} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{account.role}</td>
                  <td className="px-4 py-3 font-mono text-xs">{account.email}</td>
                  <td className="px-4 py-3 font-mono text-xs">{DEMO_PASSWORD}</td>
                  <td className="px-4 py-3 text-muted-foreground">{account.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Want your own instance instead of a shared one? See{' '}
          <a href="#install" className="text-primary underline">
            Install in minutes
          </a>{' '}
          below.
        </p>
      </div>
    </section>
  );
}
