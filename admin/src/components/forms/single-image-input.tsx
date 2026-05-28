'use client'
import { useRef, useState } from 'react'
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'
import { toast } from 'sonner'
import { Loader2, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

type Props<T extends FieldValues> = {
  control: Control<T>
  name: FieldPath<T>
  label: string
  required?: boolean
  // Server-side folder under the bucket's image/ root. Example:
  //   city/lisbon
  folder: string
}

export function SingleImageInput<T extends FieldValues>({
  control,
  name,
  label,
  required,
  folder,
}: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <ImageSlot
          value={(field.value as string | undefined) ?? ''}
          onChange={field.onChange}
          label={label}
          required={required}
          folder={folder}
          error={fieldState.error?.message}
        />
      )}
    />
  )
}

function ImageSlot({
  value,
  onChange,
  label,
  required,
  folder,
  error,
}: {
  value: string
  onChange: (url: string | undefined) => void
  label: string
  required?: boolean
  folder: string
  error?: string
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const url = await uploadImage(file, folder)
      onChange(url)
      toast.success('Image uploaded')
    } catch (err) {
      toast.error('Upload failed', {
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setIsUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>
        {label}
        {required && <span className="text-[var(--color-destructive)] ml-1">*</span>}
      </Label>
      {value ? (
        <div className="flex gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="preview"
            className="h-32 w-48 rounded-md object-cover border border-[var(--color-border)] bg-[var(--color-muted)]"
          />
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Replace
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(undefined)}
              disabled={isUploading}
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
          className="w-fit"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {isUploading ? 'Uploading…' : 'Upload image'}
        </Button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleSelect}
        className="hidden"
      />
      {error && (
        <p className="text-xs text-[var(--color-destructive)]">{error}</p>
      )}
    </div>
  )
}

// Shared upload helper. Exported so ImageListInput can reuse.
export async function uploadImage(file: File, folder: string): Promise<string> {
  const fd = new FormData()
  fd.set('file', file)
  fd.set('folder', folder)
  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string }
    throw new Error(body.message ?? `Upload failed (${res.status})`)
  }
  const json = (await res.json()) as { url: string }
  return json.url
}
