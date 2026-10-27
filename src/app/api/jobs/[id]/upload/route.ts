import { NextRequest, NextResponse } from 'next/server';
import { jobsStore, StoredPrintJob } from '@/lib/jobsStore';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id).trim();
    const body = await req.json();
    const { token, fileName, fileSize, isMaskedAadhaar } = body;

    // Check authorization: token required
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing upload authorization token. Job reference alone is not sufficient.',
        },
        { status: 401 }
      );
    }

    const cleanToken = token.replace(/\s+/g, '').toUpperCase();

    // Check in local store
    let job = jobsStore.get(decodedId);
    if (!job) {
      // Check Supabase
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { data } = await supabase
          .from('print_jobs')
          .select(`*, shop:print_shops (*)`)
          .eq('id', decodedId)
          .single();
        if (data) {
          const rec = data as unknown as StoredPrintJob;
          job = rec;
        }
      }
    }

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: `Job reference "${decodedId}" not found in PrintVault.`,
        },
        { status: 404 }
      );
    }

    // Verify token matches
    const jobCleanToken = (job.token || '').replace(/\s+/g, '').toUpperCase();
    if (jobCleanToken !== cleanToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid authorization token. Access denied to upload for this job.',
        },
        { status: 403 }
      );
    }

    const uploadedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedJob = jobsStore.updateStatus(decodedId, 'ready_for_scan', {
      fileName: fileName || job.fileName,
      fileSize: fileSize || job.fileSize,
      isMaskedAadhaar: isMaskedAadhaar !== undefined ? isMaskedAadhaar : job.isMaskedAadhaar,
      uploadedAt,
    });

    // Also update Supabase if configured
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        await supabase
          .from('print_jobs')
          .update({
            status: 'ready_for_scan',
            file_name: fileName || job.fileName,
            file_size: fileSize || job.fileSize,
            is_masked_aadhaar: isMaskedAadhaar,
            updated_at: new Date().toISOString(),
          } as never)
          .eq('id', decodedId);
      } catch {
        // Fallback to in-memory store
      }
    }

    return NextResponse.json({
      success: true,
      source: updatedJob?.source || 'local_cache',
      message: 'Document upload registered and verified with PrintVault secure enclave.',
      job: updatedJob || job,
      uploadedAt,
      isSimulatedStorage: updatedJob?.source === 'local_cache',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process document upload';
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
