'use client';

import { AUTH_CODE } from '@chat/shared';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';

interface CodeInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** Called when all 6 digits are in (typed or pasted). */
  onComplete?: (value: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

const HALF = AUTH_CODE.LENGTH / 2;
const slotClass = 'size-11 text-lg font-medium sm:size-12';

/** Six boxes for the emailed code. Accepts digits only; paste fills all boxes. */
export function CodeInput({ id, value, onChange, onComplete, invalid, disabled, autoFocus }: CodeInputProps) {
  return (
    <InputOTP
      id={id}
      maxLength={AUTH_CODE.LENGTH}
      pattern={REGEXP_ONLY_DIGITS}
      inputMode="numeric"
      autoComplete="one-time-code"
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      disabled={disabled}
      autoFocus={autoFocus}
      aria-invalid={invalid}
      containerClassName="justify-between gap-2"
    >
      <InputOTPGroup>
        {Array.from({ length: HALF }, (_, i) => (
          <InputOTPSlot key={i} index={i} className={slotClass} aria-invalid={invalid} />
        ))}
      </InputOTPGroup>
      <InputOTPSeparator className="text-muted-foreground" />
      <InputOTPGroup>
        {Array.from({ length: HALF }, (_, i) => (
          <InputOTPSlot key={i} index={i + HALF} className={slotClass} aria-invalid={invalid} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
