'use client'

import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RichTextEditor } from './rich-text-editor'
import type { TipTapDoc } from '@guide-me-app/core'

type Locale = 'en' | 'de' | 'hr'
const LOCALES: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'hr', label: 'Hrvatski' },
]

type Props<T extends FieldValues> = {
  control: Control<T>
  name: FieldPath<T>
  label: string
  required?: boolean
}

export function LocalizedRichText<T extends FieldValues>({
  control,
  name,
  label,
  required,
}: Props<T>) {
  return (
    <div className="flex flex-col gap-2">
      <Label>
        {label}
        {required && <span className="text-[var(--color-destructive)] ml-1">*</span>}
      </Label>
      <Tabs defaultValue="en" className="w-full">
        <TabsList>
          {LOCALES.map((l) => (
            <TabsTrigger key={l.value} value={l.value}>
              {l.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {LOCALES.map((l) => (
          <TabsContent key={l.value} value={l.value}>
            <Controller
              control={control}
              name={`${name}.${l.value}` as FieldPath<T>}
              render={({ field }) => (
                <RichTextEditor
                  label=""
                  value={field.value as TipTapDoc | undefined}
                  onChange={(doc) => field.onChange(doc)}
                  hint={l.value === 'en' ? undefined : 'Optional — falls back to English if empty.'}
                />
              )}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
