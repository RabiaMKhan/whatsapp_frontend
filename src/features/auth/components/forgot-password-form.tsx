'use client';

import { emailOnlySchema } from '@chat/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { getErrorMessage } from '@/lib/api/http';
import { savePending } from '../pending';
import { forgotPassword } from '../session';
import { FormAlert } from './form-alert';

export function ForgotPasswordForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm({ resolver: zodResolver(emailOnlySchema), defaultValues: { email: '' } });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async ({ email }) => {
    setServerError(null);
    try {
      const { message } = await forgotPassword({ email });
      savePending(email, 'reset');
      toast.success(message);
      router.push('/reset-password');
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="gap-5">
        <FormAlert message={serverError} />
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="h-9"
            aria-invalid={!!errors.email}
            {...form.register('email')}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Spinner />}
          {isSubmitting ? 'Sending code…' : 'Send reset code'}
        </Button>
      </FieldGroup>
    </form>
  );
}
