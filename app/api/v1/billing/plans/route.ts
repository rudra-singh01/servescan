import { NextResponse } from 'next/server';
import * as billing from '@/lib/services/billing.service';

export async function GET() {
  return NextResponse.json({ data: billing.getPlans() });
}
