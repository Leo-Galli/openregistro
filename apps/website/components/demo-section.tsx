import { ExternalLink, LogIn } from 'lucide-react';
import { Badge, Button } from '@openregistro/ui';
import { DEMO_URL } from '@/lib/constants';

const DEMO_PASSWORD = 'DemoPassword123!';

const DEMO_ACCOUNTS = [
  {
    key: 'admin',
    role: 'School admin',
    email: 'admin@demo.openregistro.local',
    description: 'School records, accounts, the audit log, and term evaluations.',
  },
  {
    key: 'teacher',
    role: 'Teacher',
    email: 'teacher@demo.openregistro.local',
    description: 'The class register, gradebook, homework, and attendance.',
  },
  {
    key: 'student',
    role: 'Student',
    email: 'student1@demo.openregistro.local',
    description: 'Grades, homework, attendance, and announcements.',
  },
  {
    key: 'guardian',
    role: 'Guardian',
    email: 'guardian1@demo.openregistro.local',
    description: "A child's grades and attendance, plus absence justifications.",
  },
] as const;

export function DemoSection() {
  return (
    <section id="demo" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight">Try the live demo</h2>
          <p className="mt-3 text-muted-foreground">
            This is the real application, not a mockup - a running instance seeded with fictional
            data. Pick a role and jump straight in. The demo is read-only: you can explore every
            screen, but nothing you change is saved for the next visitor.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <a href={`${DEMO_URL}/api/demo/login?as=teacher`} target="_blank" rel="noreferrer">
              <LogIn className="h-4 w-4" />
              Enter as teacher
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href={DEMO_URL} target="_blank" rel="noreferrer">
              Open login page
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border-2 border-border shadow-hard-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Password</th>
                <th className="px-4 py-3 font-medium">What to look at</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Open as this user</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {DEMO_ACCOUNTS.map((account) => (
                <tr key={account.email} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="font-medium">
                      {account.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{account.email}</td>
                  <td className="px-4 py-3 font-mono text-xs">{DEMO_PASSWORD}</td>
                  <td className="px-4 py-3 text-muted-foreground">{account.description}</td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild size="sm">
                      <a
                        href={`${DEMO_URL}/api/demo/login?as=${account.key}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Enter the demo as ${account.role}`}
                      >
                        <LogIn className="h-4 w-4" />
                        Enter
                      </a>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Want your own writable instance instead? See{' '}
          <a href="#install" className="text-primary underline">
            Install in minutes
          </a>{' '}
          below, or{' '}
          <a href="/host" className="text-primary underline">
            request free hosting
          </a>
          .
        </p>
      </div>
    </section>
  );
}
