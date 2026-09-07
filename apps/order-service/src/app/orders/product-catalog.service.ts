import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type ProductRow = { price: number };

@Injectable()
export class ProductCatalogService {
  constructor(private readonly config: ConfigService) {}

  async priceFor(productId: string): Promise<number> {
    const base =
      this.config.get<string>('PRODUCT_SERVICE_URL') ?? 'http://localhost:3001';
    const url = `${base.replace(/\/$/, '')}/api/products/${productId}`;
    try {
      const response = await fetch(url);
      if (response.status === 404) {
        throw new NotFoundException(`Product ${productId} not found`);
      }
      if (!response.ok) {
        throw new ServiceUnavailableException('Could not load product price');
      }
      const body = (await response.json()) as ProductRow;
      if (typeof body.price !== 'number' || body.price < 0) {
        throw new ServiceUnavailableException('Invalid product price');
      }
      return body.price;
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof ServiceUnavailableException
      ) {
        throw err;
      }
      throw new ServiceUnavailableException('Product catalog is unreachable');
    }
  }
}
