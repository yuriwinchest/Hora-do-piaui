import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default function handler(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const image = searchParams.get('image');

    const logoUrl = 'https://www.horapiaui.com/assets/logo.png';

    if (!image || image === logoUrl) {
      return new ImageResponse(
        (
          <div tw="h-full w-full flex flex-col items-center justify-center bg-white">
            <img
              src={logoUrl}
              alt="Hora do Piauí Logo"
              width="400"
              height="400"
              tw="object-contain"
            />
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    return new ImageResponse(
      (
        <div tw="relative h-full w-full flex flex-col items-start justify-end bg-black">
          <img
            src={image}
            alt="Article Background"
            tw="absolute inset-0 h-full w-full object-cover"
          />

          <div tw="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent" />

          <div tw="relative z-10 w-full flex flex-row items-center justify-between px-14 py-10">
            {title && (
              <div tw="flex flex-col w-2/3">
                <h1 tw="text-white text-6xl font-black leading-tight drop-shadow">
                  {title.slice(0, 80) + (title.length > 80 ? '...' : '')}
                </h1>
              </div>
            )}

            <div tw="flex">
              <img
                src={logoUrl}
                alt="Hora do Piauí Logo"
                width="150"
                height="150"
                tw="object-contain drop-shadow bg-white/90 rounded-full p-2"
              />
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.log(message);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
