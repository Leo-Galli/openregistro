import {
  Users,
  ClipboardCheck,
  BarChart3,
  FileCheck2,
  Database,
  Box,
  CalendarDays,
  FileText,
  ShieldCheck,
  Megaphone,
  BookOpen,
  ClipboardList,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, IconBadge } from '@openregistro/ui';

const FEATURES = [
  {
    icon: Users,
    title: 'Role-based access',
    description:
      'Admin, secretary, principal, teacher, student and guardian each see exactly what their role needs - nothing more.',
  },
  {
    icon: ClipboardCheck,
    title: 'Class register',
    description:
      'Teachers sign each lesson, log the topic covered, and record attendance - present, absent, late, or early leave.',
  },
  {
    icon: BarChart3,
    title: 'Weighted gradebook',
    description:
      'Grade entry per student and subject, with weighted averages on the student home and in the full grades view.',
  },
  {
    icon: FileCheck2,
    title: 'Absence justifications',
    description:
      'Students and guardians justify an absence online; staff review and approve or reject it, no paper slips.',
  },
  {
    icon: BookOpen,
    title: 'Homework',
    description:
      'Teachers assign work per class and subject; students and guardians see due dates in one place.',
  },
  {
    icon: Megaphone,
    title: 'Announcements with receipts',
    description:
      'School-wide or class-scoped posts, optional link attachment, and read receipts that only fire on a real view.',
  },
  {
    icon: FileText,
    title: 'Report card PDFs',
    description:
      'Term evaluations separate from live averages, exported as a printable PDF without a headless browser.',
  },
  {
    icon: CalendarDays,
    title: 'Timetable & calendar',
    description:
      'Weekly class schedules, school events and holidays, plus parent-teacher meeting slots with capacity.',
  },
  {
    icon: ClipboardList,
    title: 'Meeting booking',
    description:
      'Teachers offer time-boxed slots; guardians book for their children until capacity is reached.',
  },
  {
    icon: ShieldCheck,
    title: 'Audit log, 2FA & export',
    description:
      'Sensitive mutations are audited, TOTP two-factor is optional per user, and everyone can export their own data.',
  },
  {
    icon: Database,
    title: 'Your choice of storage',
    description:
      'Run on plain JSON files with zero infrastructure, or point at PostgreSQL when you need to scale - same application.',
  },
  {
    icon: Box,
    title: 'Self-hosted via Docker',
    description:
      'A single docker compose up brings up the full stack. No vendor lock-in, no recurring per-student fees.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-12 max-w-2xl">
        <h2 className="font-display text-3xl font-semibold">Everything a register needs</h2>
        <p className="mt-3 text-muted-foreground">
          Built around how schools actually run a register day to day - staff tools, family read
          views, and the operational pieces in between.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <Card key={feature.title} className="transition-shadow hover:shadow-hard">
            <CardHeader>
              <IconBadge>
                <feature.icon className="h-5 w-5" />
              </IconBadge>
              <CardTitle className="mt-3">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
