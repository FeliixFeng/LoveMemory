import { NextResponse } from 'next/server.js';
import { deleteExpense } from '../../../lib/app-data.ts';
import { checkRequestAuth } from '../../../lib/auth.ts';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkRequestAuth(request);
  if (authErr) return authErr;

  try {
    const { id } = await params;
    await deleteExpense(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete expense error:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
