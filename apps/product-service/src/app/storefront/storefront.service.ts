import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { access, constants, copyFile, mkdir, readFile, writeFile } from 'fs/promises';
import { Model, Types } from 'mongoose';
import { join } from 'path';
import { CatalogCache } from '@core-platform/common';
import { CreateBannerDto, UpdateStorefrontDto } from './dto/storefront.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import {
  DEFAULT_STOREFRONT,
  SEED_SOURCES,
  SEED_UPLOADS,
} from './storefront.defaults';
import { Storefront, StorefrontDocument } from './schemas/storefront.schema';

const MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
};

const FILE_NAME = /^[a-zA-Z0-9._-]+$/;

@Injectable()
export class StorefrontService {
  constructor(
    @InjectModel(Storefront.name)
    private readonly model: Model<StorefrontDocument>,
    private readonly catalogCache: CatalogCache,
  ) {}

  async get() {
    const cached = await this.catalogCache.getJson<unknown>('storefront');
    if (cached) {
      return cached;
    }
    const row = await this.load();
    const json = row.toJSON();
    await this.catalogCache.setJson('storefront', json);
    return json;
  }

  async update(input: UpdateStorefrontDto) {
    const row = await this.load();
    if (input.appName !== undefined) {
      row.appName = input.appName;
    }
    if (input.tagline !== undefined) {
      row.tagline = input.tagline;
    }
    if (input.logoUrl !== undefined) {
      row.logoUrl = input.logoUrl;
    }
    if (input.faviconUrl !== undefined) {
      row.faviconUrl = input.faviconUrl;
    }
    if (input.currency) {
      row.currency = input.currency;
    }
    if (input.hero) {
      row.set('hero', {
        headline: input.hero.headline ?? row.hero?.headline,
        sub: input.hero.sub ?? row.hero?.sub,
        imageUrl:
          input.hero.imageUrl !== undefined
            ? input.hero.imageUrl
            : row.hero?.imageUrl,
        href: input.hero.href ?? row.hero?.href,
        cta: input.hero.cta ?? row.hero?.cta,
      });
    }
    await row.save();
    await this.catalogCache.bump();
    return row;
  }

  async addBanner(input: CreateBannerDto) {
    const current = await this.load();
    const row = await this.model
      .findOneAndUpdate(
        { key: 'default' },
        {
          $push: {
            banners: {
              headline: input.headline,
              sub: input.sub ?? '',
              imageUrl: input.imageUrl,
              href: input.href,
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
    await this.catalogCache.bump();
    return row;
  }

  async updateBanner(bannerId: string, input: UpdateBannerDto) {
    if (!Types.ObjectId.isValid(bannerId)) {
      throw new NotFoundException('Banner not found');
    }
    const setFields: Record<string, unknown> = {};
    if (input.headline !== undefined) {
      setFields['banners.$.headline'] = input.headline;
    }
    if (input.sub !== undefined) {
      setFields['banners.$.sub'] = input.sub;
    }
    if (input.imageUrl !== undefined) {
      setFields['banners.$.imageUrl'] = input.imageUrl;
    }
    if (input.href !== undefined) {
      setFields['banners.$.href'] = input.href;
    }
    if (input.sortOrder !== undefined) {
      setFields['banners.$.sortOrder'] = input.sortOrder;
    }
    if (Object.keys(setFields).length === 0) {
      return this.get();
    }
    const row = await this.model
      .findOneAndUpdate(
        { key: 'default', 'banners._id': new Types.ObjectId(bannerId) },
        { $set: setFields },
        { new: true },
      )
      .exec();
    if (!row) {
      throw new NotFoundException('Banner not found');
    }
    await this.catalogCache.bump();
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
    await this.catalogCache.bump();
    return row;
  }

  async saveUpload(file: { buffer: Buffer; mimetype: string }, publicBase: string) {
    const ext = MIME_EXT[file.mimetype];
    if (!ext) {
      throw new BadRequestException('Use a JPEG, PNG, GIF, WebP, or SVG image');
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

  private async load(): Promise<StorefrontDocument> {
    let row = await this.model.findOne({ key: 'default' }).exec();
    if (!row) {
      return this.createDefaultStorefront();
    }
    return this.applyMissingDefaults(row);
  }

  private async applyMissingDefaults(row: StorefrontDocument) {
    await this.ensureSeedFilesInUploads();
    const fileUrl = (name: string) =>
      `${this.publicBaseUrl()}/api/storefront/files/${name}`;
    let dirty = false;

    const blank = (value?: string | null) => !value?.trim();

    if (blank(row.appName) || row.appName === 'My Shop') {
      row.appName = DEFAULT_STOREFRONT.appName;
      dirty = true;
    }
    if (blank(row.tagline) || row.tagline === 'Welcome') {
      row.tagline = DEFAULT_STOREFRONT.tagline;
      dirty = true;
    }
    if (blank(row.logoUrl)) {
      row.logoUrl = fileUrl(SEED_UPLOADS.logo);
      dirty = true;
    }
    if (blank(row.faviconUrl)) {
      row.faviconUrl = fileUrl(SEED_UPLOADS.favicon);
      dirty = true;
    }
    if (!row.currency) {
      row.currency = DEFAULT_STOREFRONT.currency;
      dirty = true;
    }

    const hero = row.hero ?? {
      headline: '',
      sub: '',
      imageUrl: '',
      href: '',
      cta: '',
    };
    if (!row.hero) {
      row.hero = hero;
      dirty = true;
    }

    const legacyHeadlines = new Set([
      '',
      'The drop is live. Grab it before it isn’t.',
    ]);
    const legacySubs = new Set([
      '',
      'Browse the catalog. Sign in when you’re ready to check out.',
      'Browse the catalog. Log in when you want to bag something.',
    ]);

    if (legacyHeadlines.has(hero.headline?.trim() ?? '')) {
      hero.headline = DEFAULT_STOREFRONT.hero.headline;
      dirty = true;
    }
    if (legacySubs.has(hero.sub?.trim() ?? '')) {
      hero.sub = DEFAULT_STOREFRONT.hero.sub;
      dirty = true;
    }
    if (blank(hero.imageUrl)) {
      hero.imageUrl = fileUrl(SEED_UPLOADS.hero);
      dirty = true;
    }
    if (blank(hero.href)) {
      hero.href = DEFAULT_STOREFRONT.hero.href;
      dirty = true;
    }
    if (blank(hero.cta)) {
      hero.cta = DEFAULT_STOREFRONT.hero.cta;
      dirty = true;
    }

    if (!row.banners?.length) {
      row.banners = this.defaultBanners(fileUrl);
      dirty = true;
    }

    if (dirty) {
      row.set('hero', hero);
      await row.save();
      await this.catalogCache.bump();
    }
    return row;
  }

  private defaultBanners(fileUrl: (name: string) => string) {
    return DEFAULT_STOREFRONT.banners.map((banner) => ({
      headline: banner.headline,
      sub: banner.sub,
      href: banner.href,
      sortOrder: banner.sortOrder,
      imageUrl: fileUrl(SEED_UPLOADS[banner.imageSeed]),
    }));
  }

  private async createDefaultStorefront() {
    await this.ensureSeedFilesInUploads();
    const fileUrl = (name: string) =>
      `${this.publicBaseUrl()}/api/storefront/files/${name}`;

    return this.model.create({
      key: DEFAULT_STOREFRONT.key,
      appName: DEFAULT_STOREFRONT.appName,
      tagline: DEFAULT_STOREFRONT.tagline,
      logoUrl: fileUrl(SEED_UPLOADS.logo),
      faviconUrl: fileUrl(SEED_UPLOADS.favicon),
      currency: DEFAULT_STOREFRONT.currency,
      hero: {
        ...DEFAULT_STOREFRONT.hero,
        imageUrl: fileUrl(SEED_UPLOADS.hero),
      },
      banners: this.defaultBanners(fileUrl),
    });
  }

  private async ensureSeedFilesInUploads() {
    const uploadDir = this.uploadDir();
    await mkdir(uploadDir, { recursive: true });
    const seedDir = this.seedDir();

    for (const [key, targetName] of Object.entries(SEED_UPLOADS)) {
      const target = join(uploadDir, targetName);
      try {
        await access(target, constants.F_OK);
      } catch {
        await copyFile(join(seedDir, SEED_SOURCES[key as keyof typeof SEED_SOURCES]), target);
      }
    }
  }

  private publicBaseUrl() {
    const configured = process.env.STOREFRONT_PUBLIC_URL?.replace(/\/$/, '');
    if (configured) {
      return configured;
    }
    return 'http://localhost:3001';
  }

  private seedDir() {
    const cwd = process.cwd();
    if (cwd.endsWith('product-service')) {
      return join(cwd, 'seed');
    }
    return join(cwd, 'apps/product-service/seed');
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
    if (name.endsWith('.svg')) {
      return 'image/svg+xml';
    }
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
