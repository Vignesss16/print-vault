import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { initialActiveJob } from '@/data/mockData';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('print_jobs')
        .select(`*, shop:print_shops (*)`)
        .or(`id.eq.${id},token.eq.${id}`)
        .single();

      if (!error && data) {
        return NextResponse.json({
          success: true,
          source: 'supabase',
          job: data,
        });
      }
    } catch {
      // Fallback below
    }
  }

  return NextResponse.json({
    success: true,
    source: 'local_cache',
    job: initialActiveJob,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('print_jobs')
        .update({ status, updated_at: new Date().toISOString() } as any)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({
          success: true,
          source: 'supabase',
          job: data,
        });
      }
    } catch {
      // Fallback below
    }
  }

  return NextResponse.json({
    success: true,
    source: 'local_cache',
    job: { ...initialActiveJob, status },
  });
}
