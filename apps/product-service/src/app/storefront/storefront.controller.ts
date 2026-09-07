import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public, Roles } from '@core-platform/common';
import type { Request, Response } from 'express';
import { memoryStorage } from 'multer';
import { CreateBannerDto, UpdateStorefrontDto } from './dto/storefront.dto';
import { StorefrontService } from './storefront.service';

@Controller('storefront')
export class StorefrontController {
  constructor(private readonly storefront: StorefrontService) {}

  @Public()
  @Get()
  get() {
    return this.storefront.get();
  }

  @Public()
  @Get('files/:name')
  @Header('Cross-Origin-Resource-Policy', 'cross-origin')
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  async file(@Param('name') name: string, @Res() res: Response) {
    const file = await this.storefront.readUpload(name);
    res.setHeader('Content-Type', file.contentType);
    res.send(file.data);
  }

  @Roles('admin')
  @Patch()
  update(@Body() body: UpdateStorefrontDto) {
    return this.storefront.update(body);
  }

  @Roles('admin')
  @Post('assets')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 2_000_000 },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: Request,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException('Choose an image file');
    }
    const host = req.get('host') ?? 'localhost:3001';
    const proto = req.protocol === 'https' ? 'https' : 'http';
    return this.storefront.saveUpload(file, `${proto}://${host}`);
  }

  @Roles('admin')
  @Post('banners')
  addBanner(@Body() body: CreateBannerDto) {
    return this.storefront.addBanner(body);
  }

  @Roles('admin')
  @Delete('banners/:id')
  removeBanner(@Param('id') id: string) {
    return this.storefront.removeBanner(id);
  }
}
