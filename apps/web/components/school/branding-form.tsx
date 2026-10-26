'use client';

import { useActionState } from 'react';
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  THEMES,
  getTheme,
} from '@openregistro/ui';
import { saveBranding, type BrandingFormState } from '@/app/dashboard/school/branding/actions';
import { SubmitButton } from '@/components/submit-button';
import { ColorField } from './color-field';

const initialState: BrandingFormState = { ok: false };

export function BrandingForm({
  defaults,
}: {
  defaults: { name: string; themeId: string; primaryColor: string };
}) {
  const [state, formAction] = useActionState(saveBranding, initialState);

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">School name</Label>
        <Input id="name" name="name" defaultValue={defaults.name} required />
        {state.fieldErrors?.name ? (
          <p className="text-sm text-destructive">{state.fieldErrors.name}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="themeId">Base theme</Label>
        <Select name="themeId" defaultValue={defaults.themeId}>
          <SelectTrigger id="themeId">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {THEMES.map((theme) => (
              <SelectItem key={theme.id} value={theme.id}>
                {theme.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {getTheme(defaults.themeId).description} More base themes are added through community pull
          requests - see <code>docs/theming.md</code>.
        </p>
        {state.fieldErrors?.themeId ? (
          <p className="text-sm text-destructive">{state.fieldErrors.themeId}</p>
        ) : null}
      </div>

      <ColorField defaultValue={defaults.primaryColor} />
      {state.fieldErrors?.primaryColor ? (
        <p className="-mt-3 text-sm text-destructive">{state.fieldErrors.primaryColor}</p>
      ) : null}

      {state.formError ? <p className="text-sm text-destructive">{state.formError}</p> : null}
      {state.ok ? <p className="text-sm text-success">Branding saved.</p> : null}

      <SubmitButton pendingLabel="Saving...">Save branding</SubmitButton>
    </form>
  );
}
