import Image from 'next/image'

export function Mark({ size }: { size: number }) {
  return (
    <Image
      src="/mark.svg"
      alt="HeyLocal mark"
      width={size}
      height={size}
      priority
    />
  )
}
