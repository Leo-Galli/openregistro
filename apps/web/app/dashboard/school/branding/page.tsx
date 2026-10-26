import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DEFAULT_THEME_ID,
} from '@openregistro/ui';
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
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>School branding</CardTitle>
        <CardDescription>
          Give this instance your own school&apos;s look. Pick a base theme, then optionally
          override its accent color - both apply across buttons, links, and highlights for everyone
          signed into this register, including the sign-in page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BrandingForm
          defaults={{
            name: school?.name ?? '',
            themeId: school?.themeId ?? DEFAULT_THEME_ID,
            primaryColor: school?.primaryColor ?? '',
          }}
        />
      </CardContent>
    </Card>
  );
}
