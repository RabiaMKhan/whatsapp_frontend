import { MailCheckIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { AuthHeader } from '@/features/auth/components/auth-header';
import { PendingEmailText, VerifyEmailForm } from '@/features/auth/components/verify-email-form';

export const metadata: Metadata = { title: 'Verify your email' };

export default function VerifyEmailPage() {
  return (
    <>
      <AuthHeader
        icon={MailCheckIcon}
        title="Check your email"
        description={
          <PendingEmailText flow="verify" fallback="Enter your email and the 6-digit code we sent you." />
        }
      />
      <VerifyEmailForm />
    </>
  );
}
