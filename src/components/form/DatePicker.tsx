import { useRef } from 'react';

import Flatpickr from 'react-flatpickr';
import { CalenderIcon } from '../../icons';

export interface DatePickerProps {
  id?: string;
  name?: string;
  value?: string | Date;
  onChange?: (dateStr: string, dateObj: Date | null) => void;
  placeholder?: string;
  minDate?: string | Date;
  maxDate?: string | Date;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  error?: boolean;
  dateFormat?: string;
  ariaLabel?: string;
}

export default function DatePicker({
  id,
  name,
  value,
  onChange,
  placeholder = 'Select date...',
  minDate,
  maxDate,
  disabled = false,
  required = false,
  className = '',
  error = false,
  dateFormat = 'Y-m-d',
  ariaLabel,
}: DatePickerProps) {
  const fpRef = useRef<any>(null);

  const handleOpen = () => {
    if (!disabled && fpRef.current?.flatpickr) {
      fpRef.current.flatpickr.open();
    }
  };

  let inputClasses = `h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-none focus:ring cursor-pointer dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${className}`;

  if (disabled) {
    inputClasses += ` text-gray-500 border-gray-300 opacity-50 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  } else if (error) {
    inputClasses += ` border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800`;
  } else {
    inputClasses += ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800`;
  }

  return (
    <div className="relative w-full">
      <Flatpickr
        ref={fpRef}
        id={id}
        name={name}
        value={value}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        className={inputClasses}
        options={{
          dateFormat,
          minDate: minDate as any,
          maxDate: maxDate as any,
          disableMobile: false,
          allowInput: false,
        }}
        onChange={([selectedDate], dateStr) => {
          if (onChange) {
            onChange(dateStr, selectedDate || null);
          }
        }}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={handleOpen}
        aria-label="Open calendar picker"
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer disabled:cursor-not-allowed"
      >
        <CalenderIcon className="size-5" />
      </button>
    </div>
  );
}
