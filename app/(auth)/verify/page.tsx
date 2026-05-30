'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, CheckCircle } from 'lucide-react';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-alt p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-success" />
          </div>
          <CardTitle className="font-display text-center text-brand">
            Verification email sent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 text-center">
            <Mail className="h-8 w-8 mx-auto text-text-muted" />
            <p className="text-text-primary font-medium">Check your email</p>
            {email && (
              <p className="text-sm text-text-muted break-all">
                We sent a link to: <strong>{email}</strong>
              </p>
            )}
            <p className="text-sm text-text-muted">
              Open the email and click the link to verify your account.
            </p>
          </div>

          <div className="bg-surface-alt p-4 rounded-lg space-y-2">
            <p className="text-xs font-medium text-text-muted uppercase">Didn&apos;t get the email?</p>
            <ul className="text-xs text-text-muted space-y-1 list-disc list-inside">
              <li>Check your spam folder</li>
              <li>Wait a few minutes</li>
              <li>Confirm the email address is correct</li>
            </ul>
          </div>

          <Button asChild className="w-full">
            <Link href="/login">Go to log in</Link>
          </Button>

          <p className="text-center text-xs text-text-muted">
            Need to sign up again?{' '}
            <Link href="/signup" className="text-brand hover:underline">
              Try again
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
