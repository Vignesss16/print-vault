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
        const { data: customer, error } = await supabase
          .from('customers')
          .select('id, name, age, email, password_hash, avatar_url, vault_tier')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (customer) {
          if (customer.password_hash === String(password)) {
            return NextResponse.json({
              success: true,
              source: 'supabase',
              message: 'Signed in successfully.',
              customer: {
                id: customer.id,
                name: customer.name,
                age: customer.age,
                email: customer.email,
                avatarUrl: customer.avatar_url,
                vaultTier: customer.vault_tier,
              },
            });
          } else {
            return NextResponse.json(
              { success: false, error: 'Incorrect password. Please verify and try again.' },
              { status: 401 }
            );
          }
        }
      } catch (err) {
        console.error('Supabase signin query error:', err);
      }
    }

    // Default demo fallback account (Tanishq Mudaliyar & Rohan Sharma)
    if (
      (cleanEmail === 'tanishq.mudaliyar@domain.in' || cleanEmail === 'rohan.sharma@domain.in') &&
      password === 'vault123'
    ) {
      const isTanishq = cleanEmail.includes('tanishq');
      return NextResponse.json({
        success: true,
        source: 'demo_account',
        message: 'Signed in successfully (Demo Vault Enclave).',
        customer: {
          id: isTanishq ? 'c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f' : 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          name: isTanishq ? 'Tanishq Mudaliyar' : 'Rohan Sharma',
          age: 23,
          email: cleanEmail,
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          vaultTier: 'Hardware Enclave Tier 4',
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Customer not found. Please sign up first.' },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Signin processing error' },
      { status: 500 }
    );
  }
}
