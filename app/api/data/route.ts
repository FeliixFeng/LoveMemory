import { NextResponse } from 'next/server.js';
import {
  DEFAULT_APP_DATA,
  readAppData,
  writeSettings
} from '../../lib/app-data.ts';
import { checkRequestAuth } from '../../lib/auth.ts';
import { SettingsPatchSchema } from '../../lib/schemas.ts';

export async function GET() {
  try {
    const data = await readAppData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Read data error:', error);
    return NextResponse.json(DEFAULT_APP_DATA);
  }
}

export async function POST(request: Request) {
  try {
    const authErr = checkRequestAuth(request);
    if (authErr) return authErr;

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: '请求体必须是 JSON' }, { status: 400 });
    }

    const parsed = SettingsPatchSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: '只接受 settings 与 loveQuotes 字段，其他数据请走各自的资源接口' },
        { status: 400 }
      );
    }

    await writeSettings(parsed.data);
    const data = await readAppData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Save data error:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
