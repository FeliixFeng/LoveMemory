import { NextResponse } from 'next/server.js';
import { prisma } from '../../lib/prisma.ts';
import { getPin } from '../../lib/env.ts';
import { verifyToken } from '../../lib/auth.ts';

function checkAuth(request: Request) {
  if (!getPin()) return true;
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  return token && verifyToken(token);
}

export async function GET() {
  try {
    const capsules = await prisma.capsule.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(capsules);
  } catch (error) {
    console.error('Read capsules error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: '需要验证 PIN 码' }, { status: 401 });
    }

    const body = await request.json();
    const capsule = await prisma.capsule.create({
      data: {
        title: body.title || '',
        content: body.content || '',
        emoji: body.emoji || '💌',
        unlockDate: body.unlockDate || ''
      }
    });

    return NextResponse.json({ success: true, capsule });
  } catch (error) {
    console.error('Create capsule error:', error);
    return NextResponse.json({ error: 'Failed to create capsule' }, { status: 500 });
  }
}
