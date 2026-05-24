import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  // Simplified auth - in production would create in DB
  return NextResponse.json({
    token: 'test-token-' + Date.now(),
    user: {
      id: 1,
      telegram_id: body.telegram_id,
      telegram_name: body.telegram_name || 'User',
      first_name: body.first_name || '',
      xp: 0,
      level: 1,
      tasks_solved: 0,
      streak: 0,
    }
  });
}
