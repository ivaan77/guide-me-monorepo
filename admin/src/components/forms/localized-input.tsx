'use client'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
  multiline?: boolean
  placeholder?: string
}

export function LocalizedInput<T extends FieldValues>({
  control,
  name,
  label,
  required,
  multiline,
  placeholder,
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
              render={({ field, fieldState }) =>
                multiline ? (
                  <Textarea
                    {...field}
                    value={(field.value as string | undefined) ?? ''}
                    placeholder={
                      l.value === 'en'
                        ? placeholder
                        : `${placeholder ?? ''} (optional, falls back to English)`
                    }
                  />
                ) : (
                  <Input
                    {...field}
                    value={(field.value as string | undefined) ?? ''}
                    placeholder={
                      l.value === 'en'
                        ? placeholder
                        : `${placeholder ?? ''} (optional)`
                    }
                  />
                )
              }
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
