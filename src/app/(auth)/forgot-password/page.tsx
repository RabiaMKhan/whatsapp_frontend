import { KeyRoundIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthHeader } from '@/features/auth/components/auth-header';
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';

export const metadata: Metadata = { title: 'Forgot password' };

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeader
        icon={KeyRoundIcon}
        title="Forgot your password?"
        description="Enter the email you signed up with and we'll send you a code to reset it."
      />
      <ForgotPasswordForm />
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Remembered it?{' '}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
