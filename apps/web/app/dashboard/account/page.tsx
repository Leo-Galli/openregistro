import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@openregistro/ui';
import { Download } from 'lucide-react';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

const ROLE_LABELS: Record<string, string> = {
  school_admin: 'School admin',
  secretary: 'Secretary office',
  principal: 'Principal',
  teacher: 'Teacher',
  student: 'Student',
  guardian: 'Guardian',
};

export default async function AccountPage() {
  const session = await auth();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Your account</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <p>
            <span className="text-muted-foreground">Name:</span> {session!.user.name}
          </p>
          <p>
            <span className="text-muted-foreground">Email:</span> {session!.user.email}
          </p>
          <p>
            <span className="text-muted-foreground">Role:</span>{' '}
            {ROLE_LABELS[session!.user.role] ?? session!.user.role}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your data</CardTitle>
          <CardDescription>
            Download a copy of the personal data this school register holds about you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <a href="/api/account/export" download>
              <Download className="h-4 w-4" /> Download my data
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
