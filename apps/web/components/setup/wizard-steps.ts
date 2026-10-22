export interface WizardStep {
  slug: string;
  label: string;
}

export const WIZARD_STEPS: WizardStep[] = [
  { slug: 'welcome', label: 'Welcome' },
  { slug: 'driver', label: 'Storage' },
  { slug: 'school', label: 'School' },
  { slug: 'admin', label: 'Admin account' },
  { slug: 'smtp', label: 'Email' },
  { slug: 'demo', label: 'Finish' },
];
