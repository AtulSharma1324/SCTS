import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile, unlink } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const keywordsString = formData.get('keywords') as string;
    const manualKeywords = keywordsString
      ? keywordsString.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
      : [];

    // Check for bulk upload field 'files' first, fallback to single 'file'
    const files = formData.getAll('files') as File[];
    const singleFile = formData.get('file') as File;
    const title = formData.get('title') as string;

    const filesToUpload: File[] = [];
    if (files && files.length > 0) {
      filesToUpload.push(...files);
    } else if (singleFile) {
      filesToUpload.push(singleFile);
    }

    if (filesToUpload.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    // Validate that all files are PDFs
    for (const f of filesToUpload) {
      if (!f.name.endsWith('.pdf')) {
        return NextResponse.json({ error: `File "${f.name}" is not a PDF. Only PDF documents are allowed.` }, { status: 400 });
      }
    }

    const docsDir = path.join(process.cwd(), 'public', 'docs');
    await mkdir(docsDir, { recursive: true });

    // Read existing registry
    const registryPath = path.join(docsDir, 'registry.json');
    let registry = [];
    try {
      const data = await readFile(registryPath, 'utf-8');
      registry = JSON.parse(data);
    } catch (e) {
      // Start with empty array if file does not exist
    }

    const addedDocs = [];

    // Process all files
    for (let i = 0; i < filesToUpload.length; i++) {
      const f = filesToUpload[i];
      const buffer = Buffer.from(await f.arrayBuffer());

      // Sanitize filename to prevent collisions and path traversals
      const sanitizedName = f.name.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase();
      // Add index to prevent same-timestamp conflicts in bulk uploads
      const filename = `${Date.now()}_${i}_${sanitizedName}`;
      const filePath = path.join(docsDir, filename);

      // Write PDF to static files
      await writeFile(filePath, buffer);

      // Auto-extract keywords from the filename
      const baseNameWithoutExt = f.name.replace('.pdf', '');
      const nameKeywords = baseNameWithoutExt
        .split(/[^a-zA-Z0-9]/)
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 1); // filter out tiny keywords

      // Combine manual keywords and auto-extracted keywords
      const combinedKeywords = Array.from(new Set([...manualKeywords, ...nameKeywords]));

      // Capitalize the filename cleanly for the default title if single title is not custom specified
      let docTitle = title && filesToUpload.length === 1 
        ? title 
        : baseNameWithoutExt
            .split(/[^a-zA-Z0-9]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

      const newDoc = {
        id: (Date.now() + i).toString(),
        title: docTitle,
        filename,
        url: `/api/docs?file=${filename}`,
        keywords: combinedKeywords,
        uploadedAt: new Date().toISOString()
      };

      registry.push(newDoc);
      addedDocs.push(newDoc);
    }

    // Save the updated registry
    await writeFile(registryPath, JSON.stringify(registry, null, 2));

    return NextResponse.json({ success: true, docs: addedDocs, count: addedDocs.length });
  } catch (error: any) {
    console.error("Upload handler error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const docsDir = path.join(process.cwd(), 'public', 'docs');
    const registryPath = path.join(docsDir, 'registry.json');

    // Read existing registry
    let registry: any[] = [];
    try {
      const data = await readFile(registryPath, 'utf-8');
      registry = JSON.parse(data);
    } catch (e) {
      return NextResponse.json({ error: 'Registry not found' }, { status: 404 });
    }

    // Find the document to delete
    const docToDelete = registry.find(doc => doc.id === id);
    if (!docToDelete) {
      return NextResponse.json({ error: 'Document not found in registry' }, { status: 404 });
    }

    // Remove the file from disk
    const filePath = path.join(docsDir, docToDelete.filename);
    try {
      await unlink(filePath);
    } catch (err) {
      console.warn(`File ${docToDelete.filename} could not be deleted from disk:`, err);
    }

    // Update registry list
    const updatedRegistry = registry.filter(doc => doc.id !== id);
    await writeFile(registryPath, JSON.stringify(updatedRegistry, null, 2));

    return NextResponse.json({ success: true, message: 'Document deleted successfully from SCTS DocBot!' });
  } catch (error: any) {
    console.error("Delete handler error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
