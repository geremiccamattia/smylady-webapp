import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Kleines Status-Etikett, Zuschnitt wie shadcn/ui — bewusst ohne
 * class-variance-authority, damit keine neue Abhängigkeit nötig ist.
 */

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: 'border-transparent bg-primary text-primary-foreground',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
  destructive: 'border-transparent bg-destructive text-destructive-foreground',
  outline: 'text-foreground',
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  )
}

export default Badge
