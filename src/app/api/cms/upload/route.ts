import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/auth';

/**
 * POST /api/cms/upload
 *
 * Uploads an image file to Supabase Storage (bucket: article-images).
 * Returns the public URL of the uploaded image.
 *
 * Request:  multipart/form-data with field "file"
 * Response: { success: true, url: "https://..." }
 *
 * Validation:
 *   - File type: jpg, jpeg, png, webp only
 *   - File size: max 5 MB
 *   - Requires authentication
 *
 * MANUAL SETUP (user must do in Supabase Dashboard):
 *   Storage → New Bucket → Name: article-images → Public bucket: ON
 *   Then: Storage → article-images → Policies → Add policy:
 *     - Name: "Allow authenticated uploads"
 *     - Allowed operations: INSERT
 *     - Policy definition: (auth.role() = 'authenticated')
 *     - Name: "Allow public read"
 *     - Allowed operations: SELECT
 *     - Policy definition: true
 */

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const BUCKET_NAME = 'article-images';

/**
 * Verify the ACTUAL file content (magic bytes), independent of the
 * client-supplied MIME type, which can be spoofed in a crafted request.
 * Returns the canonical MIME type or null if the bytes are not a known image.
 */
function sniffImageType(bytes: Uint8Array): string | null {
  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return 'image/png';
  }
  // WebP: "RIFF" .... "WEBP"
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided. Send as multipart/form-data with field "file"' }, { status: 400 });
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Invalid file type: ${file.type}. Allowed: jpg, png, webp` },
      { status: 400 },
    );
  }

  // Validate file size
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Max: 5 MB` },
      { status: 400 },
    );
  }

  // Generate unique filename: {userId}/{timestamp}-{originalName}
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${auth.user.id}/${timestamp}-${safeName}`;

  // Verify the ACTUAL file content — the declared MIME type above is
  // client-supplied and can be spoofed, so confirm the magic bytes too.
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const sniffedType = sniffImageType(bytes);

  if (!sniffedType) {
    return NextResponse.json(
      { error: 'File content is not a valid image (jpg, png, or webp)' },
      { status: 400 },
    );
  }

  // Upload to Supabase Storage
  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(filePath, bytes, {
      contentType: sniffedType,
      upsert: false,
    });

  if (error) {
    console.error('Storage upload error:', error.message);

    // Check for common errors
    if (error.message.includes('Bucket not found')) {
      return NextResponse.json(
        { error: 'Storage bucket "article-images" does not exist. Create it in Supabase Dashboard → Storage.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }

  // Get public URL
  const { data: publicUrlData } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return NextResponse.json({
    success: true,
    url: publicUrlData.publicUrl,
    path: filePath,
  }, { status: 201 });
}
