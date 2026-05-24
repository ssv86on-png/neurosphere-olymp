import { NextRequest, NextResponse } from 'next/server';
import tasks from './tasks.json';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const difficulty = searchParams.get('difficulty');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  
  let filtered = [...tasks];
  if (category) filtered = filtered.filter(t => t.category === category);
  if (difficulty) filtered = filtered.filter(t => t.difficulty === difficulty);
  
  const paged = filtered.slice(offset, offset + limit);
  
  return NextResponse.json({
    tasks: paged,
    total: filtered.length,
    offset,
    limit,
  });
}
