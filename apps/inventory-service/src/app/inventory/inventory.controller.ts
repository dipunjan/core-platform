import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { SetQuantityDto } from './dto/set-quantity.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  findAll() {
    return this.inventoryService.findAll();
  }

  @Get(':productId')
  findOne(@Param('productId') productId: string) {
    return this.inventoryService.findOne(productId);
  }

  @Put(':productId')
  setQuantity(
    @Param('productId') productId: string,
    @Body() body: SetQuantityDto,
  ) {
    return this.inventoryService.setQuantity(productId, body);
  }

  @Post(':productId/reserve')
  reserve(
    @Param('productId') productId: string,
    @Body() body: AdjustStockDto,
  ) {
    return this.inventoryService.reserve(productId, body);
  }

  @Post(':productId/release')
  release(
    @Param('productId') productId: string,
    @Body() body: AdjustStockDto,
  ) {
    return this.inventoryService.release(productId, body);
  }
}
