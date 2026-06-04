'use client'
import { useRef, useState } from 'react'
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, Loader2, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FieldHint } from '@/components/forms/field-hint'
import { Label } from '@/components/ui/label'
import { uploadImage } from './single-image-input'

type Props<T extends FieldValues> = {
  control: Control<T>
  name: FieldPath<T>
  label: string
  // Optional one-line hint surfaced as an (i) tooltip next to the label.
  hint?: string
  // Server-side folder under the bucket's image/ root, e.g.
  //   excursion/belem/stops/jeronimos/gallery
  folder: string
}

export function ImageListInput<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  folder,
}: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Gallery
          value={(field.value as string[] | undefined) ?? []}
          onChange={field.onChange}
          label={label}
          hint={hint}
          folder={folder}
        />
      )}
    />
  )
}

function Gallery({
  value,
  onChange,
  label,
  hint,
  folder,
}: {
  value: string[]
  onChange: (next: string[] | undefined) => void
  label: string
  hint?: string
  folder: string
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setIsUploading(true)
    try {
      const uploaded = await Promise.all(files.map((f) => uploadImage(f, folder)))
      onChange([...value, ...uploaded])
      toast.success(
        uploaded.length === 1
          ? 'Image uploaded'
          : `${uploaded.length} images uploaded`,
      )
    } catch (err) {
      toast.error('Upload failed', {
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setIsUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const remove = (idx: number) => {
    const next = value.filter((_, i) => i !== idx)
    onChange(next.length === 0 ? undefined : next)
  }

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...value]
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= next.length) return
    ;[next[idx], next[newIdx]] = [next[newIdx], next[idx]]
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <Label>{label}</Label>
        {hint && <FieldHint text={hint} />}
      </div>
      <p className="text-xs text-[var(--color-muted-foreground)]">
        These appear in the mobile app carousel in order. Drop in multiple files at once.
      </p>
      <div className="grid grid-cols-3 gap-3">
        {value.map((url, idx) => (
          <div
            key={`${url}-${idx}`}
            className="relative group rounded-md overflow-hidden border border-[var(--color-border)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-32 w-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => move(idx, 1)}
                disabled={idx === value.length - 1}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => remove(idx)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div>
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
          {isUploading ? 'Uploading…' : 'Add images'}
        </Button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleSelect}
        className="hidden"
      />
    </div>
  )
}
