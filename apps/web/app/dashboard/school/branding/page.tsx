import { auth } from '@/auth';
import { schoolIdOf } from '@/lib/authz';
import { getStorage } from '@/lib/storage';
import { BrandingForm } from '@/components/school/branding-form';

export default async function BrandingPage() {
  const session = await auth();
  const schoolId = schoolIdOf(session!);
  const storage = await getStorage();
  const school = await storage.schools.findById(schoolId);

  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-sm text-sm text-muted-foreground">
        Give this instance your own school&apos;s look. The brand color replaces the default
        OpenRegistro blue across buttons, links, and highlights for everyone signed into this
        register, including the sign-in page.
      </p>
      <BrandingForm
        defaults={{
          name: school?.name ?? '',
          primaryColor: school?.primaryColor ?? '',
        }}
      />
    </div>
  );
}
