import { NextRequest, NextResponse } from 'next/server';

const tasks = [
  { id: 1, title: 'Сумма двух чисел', category: 'algorithms', difficulty: 'easy', xp_reward: 100, description: 'Напишите функцию, которая принимает два числа и возвращает их сумму.' },
  { id: 2, title: 'Палиндром', category: 'strings', difficulty: 'easy', xp_reward: 150, description: 'Проверьте, является ли строка палиндромом.' },
  { id: 3, title: 'Сортировка пузырьком', category: 'algorithms', difficulty: 'medium', xp_reward: 200, description: 'Реализуйте сортировку пузырьком.' },
  { id: 4, title: 'Бинарный поиск', category: 'algorithms', difficulty: 'medium', xp_reward: 250, description: 'Реализуйте бинарный поиск в отсортированном массиве.' },
  { id: 5, title: 'Хеш-таблица', category: 'data-structures', difficulty: 'hard', xp_reward: 350, description: 'Реализуйте хеш-таблицу с разрешением коллизий.' },
  { id: 6, title: 'Граф: кратчайший путь', category: 'graphs', difficulty: 'hard', xp_reward: 400, description: 'Найдите кратчайший путь в графе алгоритмом Дейкстры.' },
  { id: 7, title: 'Динамическое программирование', category: 'dp', difficulty: 'expert', xp_reward: 500, description: 'Рюкзак 0/1: максимизируйте ценность предметов.' },
  { id: 8, title: 'SQL: JOIN запросы', category: 'sql', difficulty: 'medium', xp_reward: 200, description: 'Напишите SQL запрос с JOIN для объединения таблиц.' },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const difficulty = searchParams.get('difficulty');
  const limit = parseInt(searchParams.get('limit') || '50');
  
  let filtered = [...tasks];
  if (category) filtered = filtered.filter(t => t.category === category);
  if (difficulty) filtered = filtered.filter(t => t.difficulty === difficulty);
  
  return NextResponse.json(filtered.slice(0, limit));
}
