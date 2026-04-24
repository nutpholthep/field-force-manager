import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync } from 'fs';
import { stat } from 'fs/promises';
import { join, basename } from 'path';
import { randomUUID } from 'crypto';
import { pipeline } from 'stream/promises';

const SAFE_EXT = /\.[a-zA-Z0-9]{1,8}$/;

@Injectable()
export class UploadsService {
  private readonly storageDir: string;

  constructor(private readonly config: ConfigService) {
    this.storageDir = join(process.cwd(), 'storage', 'uploads');
    if (!existsSync(this.storageDir)) {
      mkdirSync(this.storageDir, { recursive: true });
    }
  }

  private publicBase(): string {
    return this.config.get<string>('API_PUBLIC_URL') ?? `http://localhost:${this.config.get<string>('PORT') ?? '3001'}`;
  }

  /** Save buffer/stream to disk; returns absolute public file_url */
  async saveUploadedFile(file: Express.Multer.File): Promise<{ file_url: string; storedName: string }> {
    if (!file?.buffer?.length && !file?.path) {
      throw new BadRequestException('No file uploaded');
    }
    const orig = file.originalname || 'upload';
    const extMatch = orig.match(SAFE_EXT);
    const ext = extMatch ? extMatch[0].toLowerCase() : '';
    const storedName = `${randomUUID()}${ext}`;
    const destPath = join(this.storageDir, storedName);

    if (file.buffer?.length) {
      const { writeFile } = await import('fs/promises');
      await writeFile(destPath, file.buffer);
    } else if (file.path) {
      const { copyFile, unlink } = await import('fs/promises');
      await copyFile(file.path, destPath);
      await unlink(file.path).catch(() => undefined);
    } else {
      throw new BadRequestException('Invalid file payload');
    }

    const file_url = `${this.publicBase()}/api/uploads/file/${storedName}`;
    return { file_url, storedName };
  }

  resolveStoredNameFromUrl(fileUrl: string): string | null {
    try {
      const u = new URL(fileUrl);
      const parts = u.pathname.split('/').filter(Boolean);
      const idx = parts.indexOf('file');
      if (idx >= 0 && parts[idx + 1]) return basename(parts[idx + 1]);
    } catch {
      const m = fileUrl.match(/\/uploads\/file\/([^/?#]+)/);
      if (m?.[1]) return basename(m[1]);
    }
    return null;
  }

  getAbsolutePathForStoredName(storedName: string): string {
    const safe = basename(storedName);
    return join(this.storageDir, safe);
  }

  async readFileText(fileUrl: string): Promise<string> {
    const name = this.resolveStoredNameFromUrl(fileUrl);
    if (!name) throw new BadRequestException('Invalid file_url');
    const abs = this.getAbsolutePathForStoredName(name);
    try {
      await stat(abs);
    } catch {
      throw new NotFoundException('Uploaded file not found');
    }
    const { readFile } = await import('fs/promises');
    return readFile(abs, 'utf8');
  }

  async pipeFileToResponse(storedName: string, res: import('express').Response): Promise<void> {
    const safe = basename(storedName);
    const abs = join(this.storageDir, safe);
    try {
      await stat(abs);
    } catch {
      throw new NotFoundException('File not found');
    }
    const { createReadStream } = await import('fs');
    const stream = createReadStream(abs);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(safe)}"`);
    await pipeline(stream, res);
  }
}
