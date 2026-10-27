import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { initialActiveJob } from '@/data/mockData';
import { jobsStore } from '@/lib/jobsStore';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id).trim();
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('print_jobs')
        .select(`*, shop:print_shops (*)`)
        .or(`id.eq.${decodedId},token.eq.${decodedId}`)
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

  // Check in-memory store for jobs created during this demo session
  const storedJob = jobsStore.get(decodedId);
  if (storedJob) {
    return NextResponse.json({
      success: true,
      source: storedJob.source || 'local_cache',
      job: storedJob,
    });
  }

  // Check fallback initialActiveJob
  if (
    decodedId.toUpperCase() === initialActiveJob.id.toUpperCase() ||
    decodedId === initialActiveJob.token
  ) {
    return NextResponse.json({
      success: true,
      source: 'local_cache',
      job: initialActiveJob,
    });
  }

  // Not found in database or local demo store
  return NextResponse.json(
    {
      success: false,
      error: `Order with reference "${decodedId}" was not found in the PrintVault registry.`,
    },
    { status: 404 }
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id).trim();
  const body = await req.json();
  const { status, paymentStatus, ...extras } = body;

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('print_jobs')
        .update({ status, updated_at: new Date().toISOString() } as never)
        .eq('id', decodedId)
        .select()
        .single();

      if (!error && data) {
        jobsStore.updateStatus(decodedId, status, { paymentStatus, ...extras });
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

  const updated = jobsStore.updateStatus(decodedId, status, { paymentStatus, ...extras });
  if (updated) {
    return NextResponse.json({
      success: true,
      source: updated.source || 'local_cache',
      job: updated,
    });
  }

  return NextResponse.json({
    success: true,
    source: 'local_cache',
    job: { ...initialActiveJob, status, paymentStatus },
  });
}
