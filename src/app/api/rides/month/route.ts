import { NextResponse, type NextRequest } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { getUserClubMembership, getRidesForMonth } from '@/lib/rides/queries';

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const yearParam = request.nextUrl.searchParams.get('year');
  const monthParam = request.nextUrl.searchParams.get('month');

  if (!yearParam || !monthParam) {
    return NextResponse.json({ error: 'year and month are required' }, { status: 400 });
  }

  const year = parseInt(yearParam, 10);
  const month = parseInt(monthParam, 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Invalid year or month' }, { status: 400 });
  }

  const membership = await getUserClubMembership();
  if (!membership) {
    return NextResponse.json({ error: 'No club membership' }, { status: 403 });
  }

  const rides = await getRidesForMonth(membership.club_id, user.id, year, month);

  return NextResponse.json(rides);
}
