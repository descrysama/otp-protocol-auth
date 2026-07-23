import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly apiKey: Buffer;

  constructor(config: ConfigService) {
    const key = config.get<string>('API_KEY');
    if (!key) {
      throw new Error('API_KEY must be configured.');
    }
    this.apiKey = Buffer.from(key);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.headers['x-api-key'];

    if (!provided || typeof provided !== 'string') {
      throw new UnauthorizedException('Missing API key.');
    }

    const providedBuf = Buffer.from(provided);
    if (
      providedBuf.length !== this.apiKey.length ||
      !crypto.timingSafeEqual(providedBuf, this.apiKey)
    ) {
      throw new UnauthorizedException('Invalid API key.');
    }

    return true;
  }
}
