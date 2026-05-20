import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get('file');

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // Security check: prevent directory traversal attacks
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid file name' }, { status: 400 });
    }

    if (filename !== 'registry.json' && !filename.endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF documents or registry can be fetched' }, { status: 400 });
    }

    const docsDir = path.join(process.cwd(), 'public', 'docs');
    const filePath = path.join(docsDir, filename);

    try {
      const fileBuffer = await readFile(filePath);
      
      const response = new NextResponse(fileBuffer);
      if (filename === 'registry.json') {
        response.headers.set('Content-Type', 'application/json');
      } else {
        response.headers.set('Content-Type', 'application/pdf');
        response.headers.set('Content-Disposition', `inline; filename="${filename}"`);
      }
      
      // Prevent browser caching of dynamic documents if required, or allow it
      response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
      
      return response;
    } catch (err) {
      if (filename === 'registry.json') {
        return NextResponse.json([]);
      }
      return NextResponse.json({ error: 'File not found' }, { status: 444 });
    }
  } catch (error: any) {
    console.error("Fetch PDF route error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
