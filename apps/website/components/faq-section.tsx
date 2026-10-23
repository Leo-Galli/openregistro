import { ChevronDown } from 'lucide-react';

const FAQ_ITEMS = [
  {
    question: 'What do I need to self-host it?',
    answer:
      'A small server or VM that can run Docker (or Node.js directly), and optionally a PostgreSQL database for production use. The JSON storage driver needs neither a database nor any special infrastructure - it stores data as files on disk.',
  },
  {
    question: 'Who owns the data?',
    answer:
      'You do. OpenRegistro runs entirely on infrastructure you control, so student and family data never passes through a third-party service. There is no telemetry sent to any external server.',
  },
  {
    question: 'How is this different from a proprietary register?',
    answer:
      "You can read every line of code that touches your students' data, run it on your own servers instead of a vendor's, and there is no per-student licensing fee. The AGPL-3.0 license also guarantees that improvements made to hosted versions of this project flow back to the community.",
  },
  {
    question: 'Is there a hosted or managed version?',
    answer:
      'Not at the moment - OpenRegistro is self-hosted only for now. If that changes, it will be announced in the project repository.',
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="border-t border-border">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="font-display text-3xl font-semibold tracking-tight">
          Frequently asked questions
        </h2>
        <div className="mt-8 flex flex-col divide-y divide-border">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium marker:content-none">
                {item.question}
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
