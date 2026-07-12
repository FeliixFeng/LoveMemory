import { NextResponse } from 'next/server.js';
import { updateWish, deleteWish } from '../../../lib/app-data.ts';
import { checkRequestAuth } from '../../../lib/auth.ts';
import { UpdateWishSchema } from '../../../lib/schemas.ts';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkRequestAuth(request);
  if (authErr) return authErr;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateWishSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const wish = await updateWish(parseInt(id), parsed.data);
    return NextResponse.json({ success: true, wish });
  } catch (error) {
    console.error('Update wish error:', error);
    return NextResponse.json({ error: 'Failed to update wish' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkRequestAuth(request);
  if (authErr) return authErr;

  try {
    const { id } = await params;
    await deleteWish(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete wish error:', error);
    return NextResponse.json({ error: 'Failed to delete wish' }, { status: 500 });
  }
}
