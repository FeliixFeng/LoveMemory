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
    const wishes = await prisma.wish.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
    return NextResponse.json(wishes);
  } catch (error) {
    console.error('Read wishes error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: '需要验证 PIN 码' }, { status: 401 });
    }

    const body = await request.json();
    const count = await prisma.wish.count();
    const wish = await prisma.wish.create({
      data: {
        title: body.title || '',
        description: body.description || '',
        emoji: body.emoji || '💝',
        sortOrder: count
      }
    });

    return NextResponse.json({ success: true, wish });
  } catch (error) {
    console.error('Create wish error:', error);
    return NextResponse.json({ error: 'Failed to create wish' }, { status: 500 });
  }
}
