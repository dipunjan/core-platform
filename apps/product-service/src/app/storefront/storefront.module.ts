import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StorefrontController } from './storefront.controller';
import { StorefrontService } from './storefront.service';
import { Storefront, StorefrontSchema } from './schemas/storefront.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Storefront.name, schema: StorefrontSchema },
    ]),
  ],
  controllers: [StorefrontController],
  providers: [StorefrontService],
})
export class StorefrontModule {}
