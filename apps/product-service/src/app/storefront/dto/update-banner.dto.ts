import { PartialType } from '@nestjs/mapped-types';
import { CreateBannerDto } from './storefront.dto';

export class UpdateBannerDto extends PartialType(CreateBannerDto) {}
