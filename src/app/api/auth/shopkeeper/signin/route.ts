import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const supabase = getSupabaseServerClient();

    if (supabase) {
      try {
        const { data: shopkeeper } = await (supabase as any)
          .from('shopkeepers')
          .select('id, shop_id, shop_name, operator_name, email, password_hash, printer_model, location, avatar_url, is_online')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (shopkeeper) {
          if (shopkeeper.password_hash === String(password)) {
            return NextResponse.json({
              success: true,
              source: 'supabase',
              message: 'Shopkeeper authenticated successfully.',
              shopkeeper: {
                id: shopkeeper.id,
                shopId: shopkeeper.shop_id,
                shopName: shopkeeper.shop_name,
                operatorName: shopkeeper.operator_name,
                email: shopkeeper.email,
                printerModel: shopkeeper.printer_model,
                location: shopkeeper.location,
                avatarUrl: shopkeeper.avatar_url,
                isOnline: shopkeeper.is_online,
                todayJobsCount: 42,
                todayEarnings: 1280,
              },
            });
          } else {
            return NextResponse.json(
              { success: false, error: 'Invalid password. Please verify and try again.' },
              { status: 401 }
            );
          }
        }
      } catch (err) {
        console.warn('Supabase shopkeeper signin query notice:', err);
      }
    }

    // Default demo fallback account (Mohan Kumar - QuickPrint Corner & Xerox)
    if (
      (cleanEmail === 'mohan.quickprint@domain.in' || cleanEmail === 'operator@quickprint.in') &&
      password === 'vault123'
    ) {
      return NextResponse.json({
        success: true,
        source: 'demo_account',
        message: 'Signed in successfully as Certified Print Operator.',
        shopkeeper: {
          id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
          shopId: 'shop-1',
          shopName: 'QuickPrint Corner & Xerox',
          operatorName: 'Mohan Kumar',
          email: 'mohan.quickprint@domain.in',
          printerModel: 'Canon imageRUNNER ADVANCE C5560i',
          location: 'Station Road, MG Road, Bengaluru',
          avatarUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=300&q=80',
          isOnline: true,
          todayJobsCount: 42,
          todayEarnings: 1280,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Shopkeeper account not found. Please register your Xerox store first.' },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Shopkeeper authentication error' },
      { status: 500 }
    );
  }
}
