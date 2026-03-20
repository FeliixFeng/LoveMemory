import { NextResponse } from 'next/server.js';
import { getStorageDriver } from '../../lib/env.ts';

export async function GET() {
  return NextResponse.json({
    success: true,
    status: 'ok',
    storageDriver: getStorageDriver()
  });
}
