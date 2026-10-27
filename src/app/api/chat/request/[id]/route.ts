import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        await (supabase as any)
          .from('chat_requests')
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase chat request update notice:', err);
      }
    }

    return NextResponse.json({
      success: true,
      requestId: id,
      status,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update chat request status' },
      { status: 500 }
    );
  }
}
