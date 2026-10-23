import { Hero } from '@/components/hero';
import { FeaturesSection } from '@/components/features-section';
import { InstallSection } from '@/components/install-section';
import { OssSection } from '@/components/oss-section';
import { FaqSection } from '@/components/faq-section';

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturesSection />
      <InstallSection />
      <OssSection />
      <FaqSection />
    </>
  );
}
