import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartsService } from './carts.service';

@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get(':userId')
  getCart(@Param('userId') userId: string) {
    return this.cartsService.getCart(userId);
  }

  @Post(':userId/items')
  addItem(@Param('userId') userId: string, @Body() body: AddCartItemDto) {
    return this.cartsService.addItem(userId, body);
  }

  @Patch(':userId/items/:productId')
  updateItem(
    @Param('userId') userId: string,
    @Param('productId') productId: string,
    @Body() body: UpdateCartItemDto,
  ) {
    return this.cartsService.updateItem(userId, productId, body);
  }

  @Delete(':userId/items/:productId')
  removeItem(
    @Param('userId') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.cartsService.removeItem(userId, productId);
  }

  @Delete(':userId')
  clear(@Param('userId') userId: string) {
    return this.cartsService.clear(userId);
  }
}
