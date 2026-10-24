import { Hero } from '@/components/hero';
import { DemoSection } from '@/components/demo-section';
import { FeaturesSection } from '@/components/features-section';
import { InstallSection } from '@/components/install-section';
import { HostingCtaSection } from '@/components/hosting-cta-section';
import { OssSection } from '@/components/oss-section';
import { FaqSection } from '@/components/faq-section';

export default function HomePage() {
  return (
    <>
      <Hero />
      <DemoSection />
      <FeaturesSection />
      <InstallSection />
      <HostingCtaSection />
      <OssSection />
      <FaqSection />
    </>
  );
}
