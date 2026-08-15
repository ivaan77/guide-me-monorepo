import Image from 'next/image'

// `variant` picks the H fill color so the mark reads on either bg tone.
// - 'default' → navy H, for light backgrounds
// - 'inverse' → white H, for dark backgrounds (landing hero, dark chrome)
export function Mark({
  size,
  variant = 'default',
}: {
  size: number
  variant?: 'default' | 'inverse'
}) {
  const src = variant === 'inverse' ? '/mark-inverse.svg' : '/mark.svg'
  return (
    <Image src={src} alt="HeyLocal mark" width={size} height={size} priority />
  )
}
