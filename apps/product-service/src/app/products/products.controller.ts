import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Public, Roles } from '@core-platform/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  findAll(
    @Query('category') category?: string,
    @Query('featured') featured?: string,
    @Query('q') q?: string,
    @Query('min') min?: string,
    @Query('max') max?: string,
    @Query('sort') sort?: string,
  ) {
    return this.productsService.findAll({
      category,
      featured: featured === 'true' || featured === '1',
      q,
      minPrice: parseCents(min),
      maxPrice: parseCents(max),
      sort,
    });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Roles('admin')
  @Post()
  create(@Body() body: CreateProductDto) {
    return this.productsService.create(body);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateProductDto) {
    return this.productsService.update(id, body);
  }

  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.productsService.remove(id);
    return { deleted: true };
  }
}

function parseCents(raw?: string): number | undefined {
  if (!raw?.trim()) {
    return undefined;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    return undefined;
  }
  return Math.round(value);
}
