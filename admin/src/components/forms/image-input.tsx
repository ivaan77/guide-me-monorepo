'use client'
import { useState } from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageGalleryPicker } from './image-gallery-picker'

type Props<T extends FieldValues> = {
  control: Control<T>
  name: FieldPath<T>
  label: string
  required?: boolean
}

// URL-input image field. Composed with the gallery picker so authors
// can either paste a URL directly or reuse an image already referenced
// somewhere else in the content system. Preview thumbnail below the
// input renders the current value.
export function ImageInput<T extends FieldValues>({ control, name, label, required }: Props<T>) {
  const [pickerOpen, setPickerOpen] = useState(false)
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
          <div className="flex gap-2">
            <Input
              {...field}
              id={name as string}
              value={(field.value as string | undefined) ?? ''}
              placeholder="https://images.unsplash.com/..."
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setPickerOpen(true)}
            >
              Gallery
            </Button>
          </div>
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
          <ImageGalleryPicker
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            onPick={(url) => field.onChange(url)}
          />
        </div>
      )}
    />
  )
}
