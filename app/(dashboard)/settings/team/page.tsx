import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TeamSettingsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Team</h1>
      <p className="mt-1 text-text-muted">Pro+ plan — invite staff (manager / staff roles)</p>
      <Card className="mt-6 max-w-lg">
        <CardHeader>
          <CardTitle>Invite team member</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-muted">
            Team invites via email — connect Resend + invite API for production.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
