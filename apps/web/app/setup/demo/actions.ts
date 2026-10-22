'use server';

import { getEnv } from '@/lib/env';
import { getStorage } from '@/lib/storage';
import { seedDemoData } from '@/lib/seed-demo';

export interface FinishSetupState {
  ok: boolean;
  formError?: string;
}

export async function finishSetup(
  _prevState: FinishSetupState,
  formData: FormData,
): Promise<FinishSetupState> {
  try {
    const storage = await getStorage();

    const [school] = await storage.schools.findMany();
    if (!school) {
      return { ok: false, formError: 'Save your school details first.' };
    }
    const [admin] = await storage.users.findMany({ role: 'school_admin' });
    if (!admin) {
      return { ok: false, formError: 'Create an administrator account first.' };
    }

    if (formData.get('loadDemoData') === 'on') {
      await seedDemoData(storage);
    }

    const env = getEnv();
    await storage.installer.complete(env.STORAGE_DRIVER);

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      formError: error instanceof Error ? error.message : 'Could not finish setup.',
    };
  }
}
