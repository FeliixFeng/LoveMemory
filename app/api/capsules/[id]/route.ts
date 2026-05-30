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
    const capsule = await prisma.capsule.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.emoji !== undefined && { emoji: body.emoji }),
        ...(body.unlockDate !== undefined && { unlockDate: body.unlockDate }),
        ...(body.isOpened !== undefined && { isOpened: body.isOpened })
      }
    });

    return NextResponse.json({ success: true, capsule });
  } catch (error) {
    console.error('Update capsule error:', error);
    return NextResponse.json({ error: 'Failed to update capsule' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: '需要验证 PIN 码' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.capsule.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete capsule error:', error);
    return NextResponse.json({ error: 'Failed to delete capsule' }, { status: 500 });
  }
}
