import { NextResponse } from 'next/server.js';
import { addExpenseWithPrisma } from '../../../../lib/app-data.ts';
import { getPin } from '../../../../lib/env.ts';
import { verifyToken } from '../../../../lib/auth.ts';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (getPin()) {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: '需要验证 PIN 码' }, { status: 401 });
    }
  }

  try {
    const { id: eventId } = await params;
    const body = await request.json();
    const expense = await addExpenseWithPrisma({
      eventId,
      amount: Number(body.amount) || 0,
      category: body.category || 'other',
      note: body.note || ''
    });
    return NextResponse.json({ success: true, expense });
  } catch (error) {
    console.error('Add expense error:', error);
    return NextResponse.json({ error: 'Failed to add expense' }, { status: 500 });
  }
}
