import type { InputHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import clsx from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, id, ...rest },
  ref,
) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-300">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={clsx(
          'w-full rounded-lg border bg-[#0b1220] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition',
          error
            ? 'border-red-500/70 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
            : 'border-slate-700 focus:border-accent focus:ring-2 focus:ring-accent/30',
          className,
        )}
        {...rest}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
})

export default Input