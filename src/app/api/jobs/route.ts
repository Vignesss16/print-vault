import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { saiXeroxShop, mockShops } from '@/data/mockData';
import { jobsStore, StoredPrintJob } from '@/lib/jobsStore';

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
    jobs: jobsStore.getAll(),
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
      shopId = 'shop-sai-xerox',
      isMaskedAadhaar = true,
      shop,
      totalPrice: customTotalPrice,
      paperSize = 'A4',
      printSide = 'single',
      binding = 'none',
      pageRange,
      instructions,
      status: requestedStatus,
    } = body;

    const unitPrice = colorMode === 'bw' ? 2 : 10;
    const computedPrice = customTotalPrice !== undefined ? customTotalPrice : unitPrice * pageCount * copies;
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randTokenNum = Math.floor(100000 + Math.random() * 900000).toString();
    const token = `${randTokenNum.slice(0, 3)} ${randTokenNum.slice(3)}`;
    const jobId = `PV-${randPart}-2026`;
    const sha256Hash = `${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 6)}`;
    const verificationKey = `${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 6)}`;

    // Resolve shop
    const resolvedShop =
      shop ||
      mockShops.find((s) => s.id === shopId) ||
      (shopId === 'shop-sai-xerox' ? saiXeroxShop : mockShops[0]);

    const initialStatus = requestedStatus || 'ready_for_scan';

    const newJobPayload = {
      id: jobId,
      token,
      file_name: fileName,
      file_size: fileSize,
      page_count: pageCount,
      copies,
      color_mode: colorMode,
      total_price: computedPrice,
      shop_id: resolvedShop.id,
      status: initialStatus,
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
          const jobRecord = data as unknown as Record<string, unknown>;
          const returnedJob: StoredPrintJob = {
            id: String(jobRecord.id),
            token: String(jobRecord.token),
            fileName: String(jobRecord.file_name || fileName),
            fileSize: String(jobRecord.file_size || fileSize),
            pageCount: Number(jobRecord.page_count || pageCount),
            copies: Number(jobRecord.copies || copies),
            colorMode: (jobRecord.color_mode as StoredPrintJob['colorMode']) || colorMode,
            totalPrice: Number(jobRecord.total_price),
            shop: resolvedShop,
            status: (jobRecord.status as StoredPrintJob['status']) || initialStatus,
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            expiresInSeconds: 600,
            isMaskedAadhaar: Boolean(jobRecord.is_masked_aadhaar ?? isMaskedAadhaar),
            sha256Hash: String(jobRecord.sha256_hash || sha256Hash),
            verificationKey: String(jobRecord.verification_key || verificationKey),
            paperSize,
            printSide,
            binding,
            pageRange,
            instructions,
            source: 'supabase',
          };
          jobsStore.set(returnedJob);
          return NextResponse.json({
            success: true,
            source: 'supabase',
            job: returnedJob,
          });
        }
      } catch {
        // Fall through to memory response
      }
    }

    const localJob: StoredPrintJob = {
      id: jobId,
      token,
      fileName,
      fileSize: fileSize || '1.2 MB',
      pageCount,
      copies,
      colorMode,
      totalPrice: computedPrice,
      shop: resolvedShop,
      status: initialStatus,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      expiresInSeconds: 600,
      isMaskedAadhaar,
      sha256Hash,
      verificationKey,
      paperSize,
      printSide,
      binding,
      pageRange,
      instructions,
      source: 'local_cache',
    };

    jobsStore.set(localJob);

    return NextResponse.json({
      success: true,
      source: 'local_cache',
      job: localJob,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Invalid request';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
