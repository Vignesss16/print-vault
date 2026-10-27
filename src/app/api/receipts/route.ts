import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { mockRecentPrints } from '@/data/mockData';

export async function GET() {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('purge_receipts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return NextResponse.json({
          success: true,
          source: 'supabase',
          receipts: (data as any[]).map((r: any) => ({
            id: r.id,
            jobId: r.job_id,
            token: r.token,
            fileName: r.file_name,
            shopName: r.shop_name,
            shopLocation: r.shop_location,
            pageCount: r.page_count,
            colorMode: r.color_mode,
            totalPrice: Number(r.total_price),
            status: r.status,
            verificationKey: r.verification_key,
            auditTrail: r.audit_trail,
            shreddedAt: r.shredded_at,
          })),
        });
      }
    } catch {
      // Fallback
    }
  }

  return NextResponse.json({
    success: true,
    source: 'local_cache',
    receipts: mockRecentPrints,
  });
}
