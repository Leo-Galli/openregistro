'use client';

import { useState } from 'react';
import { Input, Label } from '@openregistro/ui';

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function ColorField({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue || '#285a87');

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="primaryColor">Brand color</Label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          aria-label="Pick a brand color"
          value={HEX_PATTERN.test(value) ? value : '#285a87'}
          onChange={(event) => setValue(event.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border-2 border-border bg-transparent p-1"
        />
        <Input
          id="primaryColor"
          name="primaryColor"
          placeholder="#285a87"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="max-w-40 font-mono"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Used for buttons, links, and highlights across the register. Leave blank to use the default
        OpenRegistro color.
      </p>
    </div>
  );
}
