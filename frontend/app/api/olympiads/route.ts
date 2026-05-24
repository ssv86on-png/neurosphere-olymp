import { NextResponse } from 'next/server';

const olympiads = [
  { id: 1, title: 'Алгоритмическое многоборье', description: '5 задач по алгоритмам разной сложности', status: 'active', task_count: 5, participants: 12, start_date: '2026-05-20', difficulty: 'mixed' },
  { id: 2, title: 'Структуры данных', description: 'Проверь знание основных структур данных', status: 'active', task_count: 4, participants: 8, start_date: '2026-05-22', difficulty: 'hard' },
  { id: 3, title: 'Python vs JavaScript', description: 'Реши одну задачу на двух языках', status: 'draft', task_count: 3, participants: 0, start_date: '2026-06-01', difficulty: 'medium' },
];

export async function GET() {
  return NextResponse.json(olympiads);
}
