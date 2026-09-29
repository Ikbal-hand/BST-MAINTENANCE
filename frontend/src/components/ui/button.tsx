import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost'
}

export function Button({ className, variant = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:pointer-events-none disabled:opacity-50',
        variant === 'default' && 'bg-emerald-800 text-white hover:bg-emerald-900',
        variant === 'outline' && 'border border-emerald-800 text-emerald-800 hover:bg-emerald-50',
        variant === 'ghost' && 'text-slate-600 hover:bg-slate-100',
        className,
      )}
      {...props}
    />
  )
}
