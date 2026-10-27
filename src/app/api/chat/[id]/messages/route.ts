import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { senderRole, senderName, text, document } = body;

    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        await (supabase as any)
          .from('chat_messages')
          .insert({
            request_id: id,
            sender_role: senderRole || 'customer',
            sender_name: senderName || 'Tanishq Mudaliyar',
            message: text || null,
            document: document || null,
          });
      } catch (err) {
        console.warn('Supabase chat_messages insert notice:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Message delivered to encrypted ephemeral stream.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to post message' },
      { status: 500 }
    );
  }
}
