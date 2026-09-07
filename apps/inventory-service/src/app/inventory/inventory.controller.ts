import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Public, Roles } from '@core-platform/common';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { SetQuantityDto } from './dto/set-quantity.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Public()
  @Get()
  findAll() {
    return this.inventoryService.findAll();
  }

  @Public()
  @Get(':productId')
  findOne(@Param('productId') productId: string) {
    return this.inventoryService.findOne(productId);
  }

  @Roles('admin')
  @Put(':productId')
  setQuantity(
    @Param('productId') productId: string,
    @Body() body: SetQuantityDto,
  ) {
    return this.inventoryService.setQuantity(productId, body);
  }

  @Roles('admin')
  @Post(':productId/reserve')
  reserve(
    @Param('productId') productId: string,
    @Body() body: AdjustStockDto,
  ) {
    return this.inventoryService.reserve(productId, body);
  }

  @Roles('admin')
  @Post(':productId/release')
  release(
    @Param('productId') productId: string,
    @Body() body: AdjustStockDto,
  ) {
    return this.inventoryService.release(productId, body);
  }
}
