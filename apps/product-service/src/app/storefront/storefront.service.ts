import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { Model, Types } from 'mongoose';
import { join } from 'path';
import { CreateBannerDto, UpdateStorefrontDto } from './dto/storefront.dto';
import { Storefront } from './schemas/storefront.schema';

const MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

const FILE_NAME = /^[a-zA-Z0-9._-]+$/;

@Injectable()
export class StorefrontService {
  constructor(
    @InjectModel(Storefront.name)
    private readonly model: Model<Storefront>,
  ) {}

  async get() {
    const existing = await this.model.findOne({ key: 'default' }).exec();
    if (existing) {
      return existing;
    }
    return this.model.create({ key: 'default' });
  }

  async update(input: UpdateStorefrontDto) {
    const row = await this.get();
    if (input.logoUrl) {
      row.logoUrl = input.logoUrl;
    }
    if (input.currency) {
      row.currency = input.currency;
    }
    if (input.hero) {
      row.set('hero', {
        headline: input.hero.headline ?? row.hero?.headline,
        sub: input.hero.sub ?? row.hero?.sub,
        imageUrl: input.hero.imageUrl ?? row.hero?.imageUrl,
        href: input.hero.href ?? row.hero?.href,
        cta: input.hero.cta ?? row.hero?.cta,
      });
    }
    await row.save();
    return row;
  }

  async addBanner(input: CreateBannerDto) {
    const current = await this.get();
    const row = await this.model
      .findOneAndUpdate(
        { key: 'default' },
        {
          $push: {
            banners: {
              headline: input.headline,
              sub: input.sub ?? '',
              imageUrl: input.imageUrl,
              href: input.href ?? '/shop',
              sortOrder: input.sortOrder ?? current.banners.length,
            },
          },
        },
        { new: true },
      )
      .exec();
    if (!row) {
      throw new NotFoundException('Storefront not found');
    }
    return row;
  }

  async removeBanner(bannerId: string) {
    if (!Types.ObjectId.isValid(bannerId)) {
      throw new NotFoundException('Banner not found');
    }
    const row = await this.model
      .findOneAndUpdate(
        { key: 'default' },
        { $pull: { banners: { _id: new Types.ObjectId(bannerId) } } },
        { new: true },
      )
      .exec();
    if (!row) {
      throw new NotFoundException('Storefront not found');
    }
    return row;
  }

  async saveUpload(file: { buffer: Buffer; mimetype: string }, publicBase: string) {
    const ext = MIME_EXT[file.mimetype];
    if (!ext) {
      throw new BadRequestException('Use a JPEG, PNG, GIF, or WebP image');
    }
    const name = `${randomUUID()}${ext}`;
    const dir = this.uploadDir();
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, name), file.buffer);
    return { url: `${publicBase}/api/storefront/files/${name}` };
  }

  async readUpload(name: string) {
    if (!FILE_NAME.test(name) || name.includes('..')) {
      throw new NotFoundException('File not found');
    }
    try {
      const data = await readFile(join(this.uploadDir(), name));
      return { data, contentType: this.contentType(name) };
    } catch {
      throw new NotFoundException('File not found');
    }
  }

  private uploadDir() {
    if (process.env.STOREFRONT_UPLOAD_DIR) {
      return process.env.STOREFRONT_UPLOAD_DIR;
    }
    const cwd = process.cwd();
    if (cwd.endsWith('product-service')) {
      return join(cwd, 'uploads');
    }
    return join(cwd, 'apps/product-service/uploads');
  }

  private contentType(name: string) {
    if (name.endsWith('.png')) {
      return 'image/png';
    }
    if (name.endsWith('.gif')) {
      return 'image/gif';
    }
    if (name.endsWith('.webp')) {
      return 'image/webp';
    }
    return 'image/jpeg';
  }
}
