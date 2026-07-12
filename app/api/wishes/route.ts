import { NextResponse } from 'next/server.js';
import { readAppData, createWish } from '../../lib/app-data.ts';
import { checkRequestAuth } from '../../lib/auth.ts';
import { CreateWishSchema } from '../../lib/schemas.ts';

export async function GET() {
  try {
    const data = await readAppData();
    return NextResponse.json(data.wishes);
  } catch (error) {
    console.error('Read wishes error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  const authErr = checkRequestAuth(request);
  if (authErr) return authErr;

  try {
    const body = await request.json();
    const parsed = CreateWishSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const wish = await createWish(parsed.data);
    return NextResponse.json({ success: true, wish });
  } catch (error) {
    console.error('Create wish error:', error);
    return NextResponse.json({ error: 'Failed to create wish' }, { status: 500 });
  }
}
