'use client'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props<T extends FieldValues> = {
  control: Control<T>
  name: FieldPath<T>
  label: string
  required?: boolean
}

export function ImageInput<T extends FieldValues>({ control, name, label, required }: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex flex-col gap-2">
          <Label htmlFor={name as string}>
            {label}
            {required && <span className="text-[var(--color-destructive)] ml-1">*</span>}
          </Label>
          <Input
            {...field}
            id={name as string}
            value={(field.value as string | undefined) ?? ''}
            placeholder="https://images.unsplash.com/..."
          />
          {field.value && typeof field.value === 'string' && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={field.value}
              alt="preview"
              className="h-32 w-full rounded-md object-cover border border-[var(--color-border)] bg-[var(--color-muted)]"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
              onLoad={(e) => {
                ;(e.target as HTMLImageElement).style.display = ''
              }}
            />
          )}
        </div>
      )}
    />
  )
}
