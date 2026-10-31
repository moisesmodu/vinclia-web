import type { MetadataRoute } from 'next';
import { urlBase } from '@/lib/datos';
export default function robots(): MetadataRoute.Robots { return { rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/ca/compte', '/es/compte'] }], sitemap: `${urlBase()}/sitemap.xml` }; }
