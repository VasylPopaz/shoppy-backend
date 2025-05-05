import { promises as fs } from 'fs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { join } from 'path';

import { PrismaService } from '../prisma/prisma.service';
import { CreateProductRequest } from './dto/create-product.request';
import { PRODUCT_IMAGES } from './product-images';

@Injectable()
export class ProductsService {
  constructor(private readonly prismaService: PrismaService) {}
  async createProduct(data: CreateProductRequest, userId: number) {
    return this.prismaService.product.create({ data: { ...data, userId } });
  }

  async getProducts() {
    const products = await this.prismaService.product.findMany();

    return Promise.all(
      products.map(async (product) => ({
        ...product,
        imageExists: await this.imageExists(product.id),
      })),
    );
  }

  async getProduct(productId: number) {
    try {
      return {
        ...(await this.prismaService.product.findUniqueOrThrow({
          where: { id: productId },
        })),
        imageExists: await this.imageExists(productId),
      };
    } catch (error) {
      console.log(error);
      throw new NotFoundException(`Product not found with ID ${productId}`);
    }
  }

  private async imageExists(productId: number) {
    try {
      await fs.access(
        join(`${PRODUCT_IMAGES}/${productId}.jpg`),
        fs.constants.F_OK,
      );
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}
