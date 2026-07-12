import { NextResponse } from 'next/server.js';
import { updateCapsule, deleteCapsule } from '../../../lib/app-data.ts';
import { checkRequestAuth } from '../../../lib/auth.ts';
import { UpdateCapsuleSchema } from '../../../lib/schemas.ts';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkRequestAuth(request);
  if (authErr) return authErr;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateCapsuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const capsule = await updateCapsule(parseInt(id), parsed.data);
    return NextResponse.json({ success: true, capsule });
  } catch (error) {
    console.error('Update capsule error:', error);
    return NextResponse.json({ error: 'Failed to update capsule' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkRequestAuth(request);
  if (authErr) return authErr;

  try {
    const { id } = await params;
    await deleteCapsule(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete capsule error:', error);
    return NextResponse.json({ error: 'Failed to delete capsule' }, { status: 500 });
  }
}
