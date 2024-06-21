import { Injectable } from '@nestjs/common';
import { getAllCities } from './database/schema/City';

@Injectable()
export class AppService {
  async getHello(): Promise<any> {
    const cities = await getAllCities();
    return cities;
  }
}
