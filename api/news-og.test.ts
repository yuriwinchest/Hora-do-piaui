import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './news-og';

function pngHeader(width: number, height: number) {
  const bytes = new Uint8Array(64);
  bytes[0] = 0x89;
  bytes[1] = 0x50;
  bytes[2] = 0x4e;
  bytes[3] = 0x47;
  bytes[4] = 0x0d;
  bytes[5] = 0x0a;
  bytes[6] = 0x1a;
  bytes[7] = 0x0a;

  bytes[16] = (width >>> 24) & 0xff;
  bytes[17] = (width >>> 16) & 0xff;
  bytes[18] = (width >>> 8) & 0xff;
  bytes[19] = width & 0xff;

  bytes[20] = (height >>> 24) & 0xff;
  bytes[21] = (height >>> 16) & 0xff;
  bytes[22] = (height >>> 8) & 0xff;
  bytes[23] = height & 0xff;
  return bytes;
}

describe('news-og edge html', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.VITE_SUPABASE_URL = 'https://supabase.example.com';
    process.env.VITE_SUPABASE_ANON_KEY = 'anon';
  });

  it('prioritizes main image when valid and large enough', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch' as any).mockImplementation(async (input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input?.toString?.() ?? '';

      if (url.endsWith('/index.html')) {
        return new Response(
          `<!doctype html><html><head><title>Hora do Piauí</title><meta property="og:image" content="https://www.horapiaui.com/assets/logo.png"></head><body><div id="root"></div></body></html>`,
          { status: 200 }
        );
      }

      if (url.includes('/rest/v1/horapiaui_news?id=eq.')) {
        return new Response(
          JSON.stringify([
            {
              id: '1',
              title: 'Notícia X',
              description: 'Desc',
              image: 'https://cdn.example.com/main.png',
              content: '<p>ok</p>',
            },
          ]),
          { status: 200 }
        );
      }

      if (url.includes('/rest/v1/horapiaui_home_layout')) {
        return new Response(JSON.stringify([{ hero_main_id: null }]), { status: 200 });
      }

      if (url === 'https://cdn.example.com/main.png') {
        const bytes = pngHeader(800, 600);
        return new Response(bytes, { status: 200 });
      }

      return new Response('not found', { status: 404 });
    });

    const res = await handler(new Request('https://www.horapiaui.com/api/news-og?slug=1'));
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Notícia X');
    expect(html).toContain('og:image');
    expect(html).toContain('/api/og?');
    expect(html).toContain(encodeURIComponent('https://cdn.example.com/main.png'));

    fetchMock.mockRestore();
  });

  it('falls back to first content image when main is logo', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch' as any).mockImplementation(async (input: any) => {
      const url = typeof input === 'string' ? input : input?.toString?.() ?? '';

      if (url.endsWith('/index.html')) {
        return new Response(
          `<!doctype html><html><head><title>Hora do Piauí</title><meta property="og:image" content="https://www.horapiaui.com/assets/logo.png"></head><body><div id="root"></div></body></html>`,
          { status: 200 }
        );
      }

      if (url.includes('/rest/v1/horapiaui_news?id=eq.')) {
        return new Response(
          JSON.stringify([
            {
              id: '1',
              title: 'Notícia Y',
              description: 'Desc',
              image: 'https://www.horapiaui.com/assets/logo.png',
              content: '<p><img src="https://cdn.example.com/content.png"></p>',
            },
          ]),
          { status: 200 }
        );
      }

      if (url.includes('/rest/v1/horapiaui_home_layout')) {
        return new Response(JSON.stringify([{ hero_main_id: null }]), { status: 200 });
      }

      if (url === 'https://cdn.example.com/content.png') {
        const bytes = pngHeader(1200, 630);
        return new Response(bytes, { status: 200 });
      }

      return new Response('not found', { status: 404 });
    });

    const res = await handler(new Request('https://www.horapiaui.com/api/news-og?slug=1'));
    const html = await res.text();
    expect(html).toContain(encodeURIComponent('https://cdn.example.com/content.png'));

    fetchMock.mockRestore();
  });

  it('falls back to featured image when article has no usable image', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch' as any).mockImplementation(async (input: any) => {
      const url = typeof input === 'string' ? input : input?.toString?.() ?? '';

      if (url.endsWith('/index.html')) {
        return new Response(
          `<!doctype html><html><head><title>Hora do Piauí</title><meta property="og:image" content="https://www.horapiaui.com/assets/logo.png"></head><body><div id="root"></div></body></html>`,
          { status: 200 }
        );
      }

      if (url.includes('/rest/v1/horapiaui_home_layout')) {
        return new Response(JSON.stringify([{ hero_main_id: 'featured-id' }]), { status: 200 });
      }

      if (url.includes('/rest/v1/horapiaui_news?id=eq.featured-id')) {
        return new Response(
          JSON.stringify([
            {
              id: 'featured-id',
              title: 'Featured',
              description: 'Featured desc',
              image: 'https://cdn.example.com/featured.png',
              content: null,
            },
          ]),
          { status: 200 }
        );
      }

      if (url.includes('/rest/v1/horapiaui_news?id=eq.')) {
        return new Response(
          JSON.stringify([
            {
              id: '1',
              title: 'Notícia Z',
              description: 'Desc',
              image: '',
              content: '<p>sem imagens</p>',
            },
          ]),
          { status: 200 }
        );
      }

      if (url === 'https://cdn.example.com/featured.png') {
        const bytes = pngHeader(700, 500);
        return new Response(bytes, { status: 200 });
      }

      return new Response('not found', { status: 404 });
    });

    const res = await handler(new Request('https://www.horapiaui.com/api/news-og?slug=1'));
    const html = await res.text();
    expect(html).toContain(encodeURIComponent('https://cdn.example.com/featured.png'));

    fetchMock.mockRestore();
  });
});

