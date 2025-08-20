import { BadRequestException } from '@nestjs/common';

const DOMAIN_WHITELIST = ['example.com', 'trusted.com'];
const ENFORCE_DOMAIN_WHITELIST = process.env.ENFORCE_DOMAIN_WHITELIST === 'true';

export function validateUrl(url: string): void {
  if (!url) throw new BadRequestException('URL is required');

  try {
    const hostname = new URL(url).hostname;

    if (ENFORCE_DOMAIN_WHITELIST && !DOMAIN_WHITELIST.includes(hostname)) {
      throw new BadRequestException('URL domain not allowed.');
    }
  } catch {
    throw new BadRequestException('Invalid URL format');
  }
}
