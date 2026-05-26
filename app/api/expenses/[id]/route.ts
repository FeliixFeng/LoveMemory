import { NextResponse } from 'next/server.js';
import { deleteExpenseWithPrisma } from '../../../lib/app-data.ts';
import { getPin } from '../../../lib/env.ts';
import { verifyToken } from '../../../lib/auth.ts';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (getPin()) {
    const authHeader = _request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: '需要验证 PIN 码' }, { status: 401 });
    }
  }

  try {
    const { id } = await params;
    await deleteExpenseWithPrisma(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete expense error:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
