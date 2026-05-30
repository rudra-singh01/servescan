import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BranchesPage() {
  return (
    <div className="p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold">Branches</h1>
      <p className="mt-1 text-text-muted">Business plan — multiple locations manage karein</p>
      <Card className="mt-6 max-w-lg">
        <CardHeader>
          <CardTitle>Main Branch</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-muted">Default branch — onboarding par create hota hai</p>
        </CardContent>
      </Card>
    </div>
  );
}
