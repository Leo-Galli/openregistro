'use client';

import { Download, GraduationCap, CalendarCheck2 } from 'lucide-react';
import { motion } from 'motion/react';

const STEPS = [
  {
    icon: Download,
    tone: 'bg-primary-300',
    title: 'Install, or get hosted free',
    description:
      'Run one Docker command on your own server, or let us set up and host a dedicated instance for you at no cost.',
  },
  {
    icon: GraduationCap,
    tone: 'bg-blue-200',
    title: 'Set up your school',
    description:
      'A first-run wizard walks you through your school, classes, subjects, and staff and student accounts.',
  },
  {
    icon: CalendarCheck2,
    tone: 'bg-pink-400',
    title: 'Run your register',
    description:
      'Teachers take attendance and enter grades, families see progress in real time, and everything stays on your own infrastructure.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="border-t-2 border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 max-w-2xl">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink">
            How it works
          </h2>
          <p className="mt-3 font-semibold text-muted-foreground">
            From zero to a running register in three steps - no sales call required.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: index * 0.1, duration: 0.4, ease: 'easeOut' }}
              className="flex flex-col items-start gap-4 rounded-2xl border-2 border-border bg-surface p-6 shadow-hard"
            >
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-ink text-ink ${step.tone}`}
              >
                <step.icon className="h-8 w-8" />
              </span>
              <h3 className="font-display text-xl font-extrabold text-ink">{step.title}</h3>
              <p className="font-semibold text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
