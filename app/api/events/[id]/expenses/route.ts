import { NextResponse } from 'next/server.js';
import { addExpense } from '../../../../lib/app-data.ts';
import { checkRequestAuth } from '../../../../lib/auth.ts';
import { AddExpenseSchema } from '../../../../lib/schemas.ts';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkRequestAuth(request);
  if (authErr) return authErr;

  try {
    const { id: eventId } = await params;
    const body = await request.json();
    const parsed = AddExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const expense = await addExpense({ eventId, ...parsed.data });
    return NextResponse.json({ success: true, expense });
  } catch (error) {
    console.error('Add expense error:', error);
    return NextResponse.json({ error: 'Failed to add expense' }, { status: 500 });
  }
}
