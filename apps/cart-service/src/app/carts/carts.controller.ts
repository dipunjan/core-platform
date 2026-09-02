import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser, type AuthUser } from '@core-platform/common';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartsService } from './carts.service';

@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get()
  getCart(@CurrentUser() user: AuthUser) {
    return this.cartsService.getCart(user.sub);
  }

  @Post('items')
  addItem(@CurrentUser() user: AuthUser, @Body() body: AddCartItemDto) {
    return this.cartsService.addItem(user.sub, body);
  }

  @Patch('items/:productId')
  updateItem(
    @CurrentUser() user: AuthUser,
    @Param('productId') productId: string,
    @Body() body: UpdateCartItemDto,
  ) {
    return this.cartsService.updateItem(user.sub, productId, body);
  }

  @Delete('items/:productId')
  removeItem(
    @CurrentUser() user: AuthUser,
    @Param('productId') productId: string,
  ) {
    return this.cartsService.removeItem(user.sub, productId);
  }

  @Delete()
  clear(@CurrentUser() user: AuthUser) {
    return this.cartsService.clear(user.sub);
  }
}
