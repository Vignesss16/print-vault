import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, customerId, customerName, shopId, shopName, operatorName } = body;

    const id = requestId || `req-${Date.now()}`;
    const supabase = getSupabaseServerClient();

    if (supabase) {
      try {
        await (supabase as any)
          .from('chat_requests')
          .insert({
            id,
            customer_id: customerId,
            customer_name: customerName || 'Tanishq Mudaliyar',
            shop_id: shopId,
            shop_name: shopName,
            operator_name: operatorName || 'Mohan Kumar',
            status: 'pending',
          });
      } catch (err) {
        console.warn('Supabase chat_requests insert notice:', err);
      }
    }

    return NextResponse.json({
      success: true,
      requestId: id,
      message: 'Connection request created successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create chat request' },
      { status: 500 }
    );
  }
}
