import { LockKeyholeIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { AuthHeader } from '@/features/auth/components/auth-header';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';
import { PendingEmailText } from '@/features/auth/components/verify-email-form';

export const metadata: Metadata = { title: 'Reset password' };

export default function ResetPasswordPage() {
  return (
    <>
      <AuthHeader
        icon={LockKeyholeIcon}
        title="Set a new password"
        description={
          <PendingEmailText flow="reset" fallback="Enter your email, the code we sent you, and a new password." />
        }
      />
      <ResetPasswordForm />
    </>
  );
}
