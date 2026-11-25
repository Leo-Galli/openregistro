import { Hero } from '@/components/hero';
import { HowItWorksSection } from '@/components/how-it-works-section';
import { DemoSection } from '@/components/demo-section';
import { FeaturesSection } from '@/components/features-section';
import { InstallSection } from '@/components/install-section';
import { HostingCtaSection } from '@/components/hosting-cta-section';
import { DonateSection } from '@/components/donate-section';
import { DownloadAppSection } from '@/components/download-app-section';
import { OssSection } from '@/components/oss-section';
import { FaqSection } from '@/components/faq-section';

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorksSection />
      <DemoSection />
      <FeaturesSection />
      <DownloadAppSection />
      <InstallSection />
      <HostingCtaSection />
      <DonateSection />
      <OssSection />
      <FaqSection />
    </>
  );
}
