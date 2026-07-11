export function Mark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="GuideMe mark"
    >
      <path
        d="M10 50 C 22 50, 30 46, 36 34 S 46 14, 54 14"
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="54" cy="14" r="6.5" fill="var(--color-amber)" />
      <circle cx="10" cy="50" r="2.5" fill="var(--color-primary)" opacity=".85" />
    </svg>
  )
}
