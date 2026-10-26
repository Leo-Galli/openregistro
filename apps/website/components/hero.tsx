'use client';

import { ArrowRight, ExternalLink, Github } from 'lucide-react';
import { motion } from 'motion/react';
import { Button, StickerBadge } from '@openregistro/ui';
import { REPO_URL, DEMO_URL } from '@/lib/constants';
import { WavyEdge } from './wavy-edge';

const HEADLINE = ['A register', 'you run', 'yourself.'];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-primary-400 pb-24 pt-20 sm:pt-28">
      <div className="relative mx-auto flex max-w-4xl flex-col items-start gap-6 px-6 sm:items-center sm:text-center">
        <StickerBadge tone="pink" rotate={-6} delay={0.2}>
          Open source
        </StickerBadge>

        <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-7xl">
          {HEADLINE.map((word, index) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18, delay: index * 0.08 }}
              className="mr-4 inline-block last:mr-0"
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <p className="max-w-2xl text-lg font-semibold text-ink/80">
          OpenRegistro is a complete electronic register for K-12 schools: roles for staff, students
          and families, a daily class register, a weighted gradebook, and an online
          absence-justification workflow. Install it on your own server or a single container - your
          students&apos; data never leaves your infrastructure.
        </p>

        <div className="flex flex-wrap items-center gap-3 sm:justify-center">
          <Button asChild variant="secondary" size="lg">
            <a href={DEMO_URL} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              Try the live demo
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              <Github className="h-4 w-4" />
              View on GitHub
            </a>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <a href="/docs">
              Read the docs
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>

      <WavyEdge className="absolute inset-x-0 bottom-0 h-12 w-full text-background" />
    </section>
  );
}
