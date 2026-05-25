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
  // Server-side folder under the bucket's audio/ root. Example:
  //   excursion/belem/jeronimos
  folder: string
}

export function AudioInput<T extends FieldValues>({
  control,
  name,
  label,
  folder,
}: Props<T>) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <p className="text-xs text-[var(--color-muted-foreground)]">
        Upload one audio file per language. All locales are optional.
      </p>
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
                <AudioSlot
                  value={field.value as string | undefined}
                  onChange={field.onChange}
                  folder={`${folder}/${l.value}`}
                />
              )}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function AudioSlot({
  value,
  onChange,
  folder,
}: {
  value: string | undefined
  onChange: (url: string | undefined) => void
  folder: string
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const fd = new FormData()
      fd.set('file', file)
      fd.set('folder', folder)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string }
        throw new Error(body.message ?? `Upload failed (${res.status})`)
      }
      const json = (await res.json()) as { url: string }
      onChange(json.url)
      toast.success('Audio uploaded')
    } catch (err) {
      toast.error('Upload failed', {
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setIsUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-[var(--color-border)] p-3">
        <audio src={value} controls className="h-9 flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange(undefined)}
          aria-label="Remove audio"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        onChange={handleSelect}
        className="hidden"
        disabled={isUploading}
      />
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
        {isUploading ? 'Uploading…' : 'Upload audio'}
      </Button>
      <span className="text-xs text-[var(--color-muted-foreground)]">
        mp3, m4a, etc.
      </span>
    </div>
  )
}
