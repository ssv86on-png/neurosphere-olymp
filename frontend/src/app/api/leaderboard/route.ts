import { NextResponse } from 'next/server';

const leaderboard = [
  { id: 1, telegram_name: 'CodeMaster', xp: 4500, level: 5, tasks_solved: 42 },
  { id: 2, telegram_name: 'AI_Warrior', xp: 3200, level: 4, tasks_solved: 28 },
  { id: 3, telegram_name: 'DataNinja', xp: 2100, level: 3, tasks_solved: 19 },
  { id: 4, telegram_name: 'Pythonista', xp: 1500, level: 2, tasks_solved: 14 },
  { id: 5, telegram_name: 'BugHunter', xp: 800, level: 2, tasks_solved: 7 },
];

export async function GET() {
  return NextResponse.json(leaderboard);
}
