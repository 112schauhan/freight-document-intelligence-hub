"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { format, isValid, parse } from "date-fns"
import { DayPicker, type Matcher } from "react-day-picker"
import "react-day-picker/style.css"

const DISPLAY_FORMAT = "MMM d, yyyy"
const API_FORMAT = "yyyy-MM-dd"

export interface DatePickerProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  min?: string
  max?: string
  disabled?: boolean
  className?: string
  "aria-label"?: string
}

function parseValue(value: string): Date | undefined {
  if (!value || value.trim() === "") return undefined
  const parsed = parse(value, API_FORMAT, new Date())
  return isValid(parsed) ? parsed : undefined
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Select date",
  min,
  max,
  disabled = false,
  className = "",
  "aria-label": ariaLabel,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState<Date>(() => parseValue(value) ?? new Date())
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedDate = parseValue(value)
  const displayValue = selectedDate ? format(selectedDate, DISPLAY_FORMAT) : ""

  const minDate = min ? parseValue(min) : undefined
  const maxDate = max ? parseValue(max) : undefined

  const handleSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) {
        onChange("")
      } else {
        onChange(format(date, API_FORMAT))
        setMonth(date)
      }
      setOpen(false)
    },
    [onChange]
  )

  useEffect(() => {
    if (!open) return
    const next = parseValue(value)
    if (next) setMonth(next)
  }, [open, value])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  const inputFocusClass =
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500 focus-visible:ring-offset-2"

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-left text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${inputFocusClass}`}
      >
        <span className={!displayValue ? "text-zinc-500 dark:text-zinc-400" : ""}>
          {displayValue || placeholder}
        </span>
      </button>
      {open && (
        <div
          className="date-picker-popover absolute z-50 mt-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 shadow-lg"
          role="dialog"
          aria-modal="true"
          aria-label="Choose date"
        >
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            month={month}
            onMonthChange={setMonth}
            disabled={
              minDate || maxDate
                ? ([
                    ...(minDate ? [{ before: minDate }] : []),
                    ...(maxDate ? [{ after: maxDate }] : []),
                  ] as Matcher[])
                : undefined
            }
            defaultMonth={selectedDate ?? month}
            className="rdp-wrapper"
          />
        </div>
      )}
    </div>
  )
}
