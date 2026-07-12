import { NextResponse } from 'next/server.js';
import { readAppData, createCapsule } from '../../lib/app-data.ts';
import { checkRequestAuth } from '../../lib/auth.ts';
import { CreateCapsuleSchema } from '../../lib/schemas.ts';

export async function GET() {
  try {
    const data = await readAppData();
    return NextResponse.json(data.capsules);
  } catch (error) {
    console.error('Read capsules error:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  const authErr = checkRequestAuth(request);
  if (authErr) return authErr;

  try {
    const body = await request.json();
    const parsed = CreateCapsuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const capsule = await createCapsule(parsed.data);
    return NextResponse.json({ success: true, capsule });
  } catch (error) {
    console.error('Create capsule error:', error);
    return NextResponse.json({ error: 'Failed to create capsule' }, { status: 500 });
  }
}
