import { envConfig } from '@workspace/web/config/env'

export const baseOpenGraph = {
  locale: 'en_US',
  alternateLocale: ['vi_VN'],
  type: 'website',
  siteName: 'Crypto Data Analytics Platform',
  images: [
    {
      url: `${envConfig.NEXT_PUBLIC_URL}/api/og`,
      width: 1200,
      height: 630,
      alt: 'Real-time Crypto Data Analytics Platform'
    }
  ]
}
