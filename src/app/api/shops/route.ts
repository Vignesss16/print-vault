import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { mockShops } from '@/data/mockData';

export async function GET() {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('print_shops')
        .select('*')
        .order('rating', { ascending: false });

      if (!error && data && data.length > 0) {
        return NextResponse.json({
          success: true,
          source: 'supabase',
          shops: (data as any[]).map((s: any) => ({
            id: s.id,
            name: s.name,
            location: s.location,
            distance: s.distance,
            rating: Number(s.rating),
            jobsCount: s.jobs_count,
            statusBadge: s.status_badge,
            image: s.image,
          })),
        });
      }
    } catch {
      // Fallback below
    }
  }

  // Graceful fallback to initial certified shops
  return NextResponse.json({
    success: true,
    source: 'local_cache',
    shops: mockShops,
  });
}
