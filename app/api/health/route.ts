import { NextResponse } from 'next/server';
import { getStorageDriver } from '../../../src/storage/index.js';

export async function GET() {
  return NextResponse.json({
    success: true,
    status: 'ok',
    storageDriver: getStorageDriver()
  });
}
