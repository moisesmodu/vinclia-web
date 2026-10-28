import type { MetadataRoute } from 'next';
import { urlBase } from '@/lib/datos';

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/ca/cuenta', '/es/cuenta', '/ca/entrar', '/es/entrar', '/ca/practicar/', '/es/practicar/'] }], sitemap: `${urlBase()}/sitemap.xml` };
}
