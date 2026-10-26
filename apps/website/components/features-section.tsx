import { Users, ClipboardCheck, BarChart3, FileCheck2, Database, Box } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@openregistro/ui';

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
      "Grade entry per student and subject, with weighted averages computed automatically from each grade's weight.",
  },
  {
    icon: FileCheck2,
    title: 'Absence justifications',
    description:
      'Students and guardians justify an absence online; staff review and approve or reject it, no paper slips.',
  },
  {
    icon: Database,
    title: 'Your choice of storage',
    description:
      'Run on plain JSON files with zero infrastructure, or point at PostgreSQL when you need to scale - same application, same data model.',
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
          Built around how schools actually run a register day to day, not around a generic CRUD
          template.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <Card key={feature.title} className="transition-shadow hover:shadow-hard">
            <CardHeader>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink bg-primary-300 text-ink">
                <feature.icon className="h-5 w-5" />
              </span>
              <CardTitle className="mt-3">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
