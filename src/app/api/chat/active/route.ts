import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

// In-memory server cache for instant multi-client sync
let activeSessionCache: any = null;

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        // Fetch latest pending or accepted request from Supabase
        const { data: request } = await (supabase as any)
          .from('chat_requests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (request) {
          const { data: messages } = await (supabase as any)
            .from('chat_messages')
            .select('*')
            .eq('request_id', request.id)
            .order('created_at', { ascending: true });

          const session = {
            requestId: request.id,
            customer: {
              id: request.customer_id,
              name: request.customer_name,
              email: `${request.customer_name.toLowerCase().replace(/\s+/g, '.')}@domain.in`,
              age: 24,
            },
            shop: {
              id: request.shop_id || 'shop-1',
              name: request.shop_name,
              operatorName: request.operator_name,
              distance: '120m away',
              location: 'MG Road Hub, Bengaluru',
              rating: 4.9,
              pricePerBw: 2,
              pricePerColor: 5,
              printerModel: 'Canon Laser Spooler',
              isOnline: true,
            },
            status: request.status,
            createdAt: request.created_at,
            messages: (messages || []).map((m: any) => ({
              id: m.id,
              requestId: m.request_id,
              senderRole: m.sender_role,
              senderName: m.sender_name,
              text: m.message,
              document: m.document,
              timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            })),
          };

          activeSessionCache = session;
          return NextResponse.json({ success: true, session });
        }
      } catch (err) {
        // Fallback to in-memory cache
      }
    }

    return NextResponse.json({ success: true, session: activeSessionCache });
  } catch (error: any) {
    return NextResponse.json({ success: true, session: activeSessionCache });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session, action } = body;

    if (action === 'clear') {
      activeSessionCache = null;
      return NextResponse.json({ success: true, cleared: true });
    }

    if (session) {
      activeSessionCache = session;
    }

    return NextResponse.json({ success: true, session: activeSessionCache });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
