import { NextResponse } from 'next/server.js';
import { prisma } from '../../../lib/prisma.ts';
import { getPin } from '../../../lib/env.ts';
import { verifyToken } from '../../../lib/auth.ts';

function checkAuth(request: Request) {
  if (!getPin()) return true;
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  return token && verifyToken(token);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: '需要验证 PIN 码' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const wish = await prisma.wish.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.emoji !== undefined && { emoji: body.emoji }),
        ...(body.isCompleted !== undefined && { isCompleted: body.isCompleted }),
        ...(body.completedAt !== undefined && { completedAt: body.completedAt })
      }
    });

    return NextResponse.json({ success: true, wish });
  } catch (error) {
    console.error('Update wish error:', error);
    return NextResponse.json({ error: 'Failed to update wish' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: '需要验证 PIN 码' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.wish.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete wish error:', error);
    return NextResponse.json({ error: 'Failed to delete wish' }, { status: 500 });
  }
}
