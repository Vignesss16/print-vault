import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { initialActiveJob } from '@/data/mockData';

export async function GET() {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('print_jobs')
        .select(`
          *,
          shop:print_shops (*)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return NextResponse.json({
          success: true,
          source: 'supabase',
          jobs: data,
        });
      }
    } catch {
      // Fallback below
    }
  }

  return NextResponse.json({
    success: true,
    source: 'local_cache',
    jobs: [initialActiveJob],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fileName,
      fileSize,
      pageCount = 1,
      copies = 1,
      colorMode = 'bw',
      shopId = 'shop-1',
      isMaskedAadhaar = true,
      shop,
    } = body;

    const unitPrice = colorMode === 'bw' ? 3 : 10;
    const totalPrice = unitPrice * pageCount * copies;
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randTokenNum = Math.floor(100000 + Math.random() * 900000).toString();
    const token = `${randTokenNum.slice(0, 3)} ${randTokenNum.slice(3)}`;
    const jobId = `PV-${randPart}-2026`;
    const sha256Hash = `${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 6)}`;
    const verificationKey = `${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 6)}`;

    const newJobPayload = {
      id: jobId,
      token,
      file_name: fileName,
      file_size: fileSize,
      page_count: pageCount,
      copies,
      color_mode: colorMode,
      total_price: totalPrice,
      shop_id: shopId,
      status: 'ready_for_scan' as const,
      is_masked_aadhaar: isMaskedAadhaar,
      sha256_hash: sha256Hash,
      verification_key: verificationKey,
    };

    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('print_jobs')
          .insert(newJobPayload)
          .select()
          .single();

        if (!error && data) {
          const jobRecord = data as any;
          return NextResponse.json({
            success: true,
            source: 'supabase',
            job: {
              ...jobRecord,
              fileName: jobRecord.file_name,
              fileSize: jobRecord.file_size,
              pageCount: jobRecord.page_count,
              colorMode: jobRecord.color_mode,
              totalPrice: Number(jobRecord.total_price),
              shop: shop || { id: shopId, name: 'QuickPrint Corner' },
            },
          });
        }
      } catch {
        // Fall through to memory response
      }
    }

    return NextResponse.json({
      success: true,
      source: 'local_cache',
      job: {
        id: jobId,
        token,
        fileName,
        fileSize,
        pageCount,
        copies,
        colorMode,
        totalPrice,
        shop: shop || { id: shopId, name: 'QuickPrint Corner' },
        status: 'ready_for_scan',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        expiresInSeconds: 600,
        isMaskedAadhaar,
        sha256Hash,
        verificationKey,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Invalid request' },
      { status: 400 }
    );
  }
}
