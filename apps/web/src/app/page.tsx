import { GithubLogoIcon } from '@phosphor-icons/react/ssr'
import { ArchitectureFlow } from '@workspace/web/components/features/home/architecture-flow'
import Features from '@workspace/web/components/features/home/features'
import Hero from '@workspace/web/components/features/home/hero'
import Overview from '@workspace/web/components/features/home/overview'
import TechStack from '@workspace/web/components/features/home/tech-stack'
import Footer from '@workspace/web/components/layout/footer'
import Header from '@workspace/web/components/layout/header'
import { Button } from '@workspace/web/components/ui/button'
import Link from 'next/link'

export default function Page() {
  return (
    <main className='text-foreground min-h-screen'>
      {/* Header */}
      <Header />

      {/* Hero */}
      <section className='relative overflow-hidden'>
        <div className='bg-gradient-hero pointer-events-none absolute inset-0' />
        <div className='bg-primary/20 pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full blur-[120px]' />
        <div className='relative mx-auto max-w-7xl px-6 pt-24 pb-32'>
          <Hero />
        </div>
      </section>

      {/* Overview */}
      <Overview />

      {/* Architecture */}
      <section id='architecture' className='mx-auto max-w-7xl px-6 py-24'>
        <div className='text-accent mb-4 text-xs font-semibold tracking-[0.25em] uppercase'>
          02 · Kiến trúc hệ thống
        </div>
        <h2 className='mb-3 text-4xl font-bold tracking-tight'>
          Lambda architecture trên <span className='text-gradient-primary'>Kubernetes</span>
        </h2>
        <p className='text-muted-foreground mb-10 max-w-2xl'>
          Tách biệt rõ ràng 4 layer: Ingestion → Processing &amp; Storage → Serving → Presentation. Toàn bộ workload
          đóng gói container, scale độc lập.
        </p>
        <ArchitectureFlow />
      </section>

      {/* Features */}
      <section id='features' className='mx-auto max-w-7xl px-6 py-24'>
        <div className='text-accent mb-4 text-xs font-semibold tracking-[0.25em] uppercase'>03 · Điểm nổi bật</div>
        <h2 className='mb-12 text-4xl font-bold tracking-tight'>Những gì hệ thống có thể làm</h2>
        <div className='grid gap-5 md:grid-cols-2 lg:grid-cols-3'>
          <Features />
        </div>
      </section>

      {/* Stack */}
      <section id='stack' className='mx-auto max-w-7xl px-6 py-24'>
        <div className='text-accent mb-4 text-xs font-semibold tracking-[0.25em] uppercase'>04 · Tech stack</div>
        <h2 className='mb-12 text-4xl font-bold tracking-tight'>
          Built with <span className='text-gradient-accent'>production-grade</span> tools
        </h2>
        <TechStack />
      </section>

      {/* CTA */}
      <section className='mx-auto max-w-7xl px-6 py-24'>
        <div className='border-border bg-card/60 relative overflow-hidden rounded-3xl border p-12 text-center backdrop-blur md:p-16'>
          <div className='bg-gradient-hero absolute inset-0 opacity-70' />
          <div className='relative'>
            <h2 className='mx-auto max-w-2xl text-4xl font-bold tracking-tight md:text-5xl'>
              Sẵn sàng khám phá toàn bộ pipeline?
            </h2>
            <p className='text-muted-foreground mx-auto mt-4 max-w-xl'>
              Source code, Helm charts và tài liệu triển khai đều có sẵn trên GitHub.
            </p>
            <div className='mt-8 flex flex-wrap justify-center gap-3'>
              <Link href='https://github.com/ZeinosNSB/crypto-data-analytics-system'>
                <Button
                  size='lg'
                  className='from-primary text-primary-foreground gap-2 bg-gradient-to-r to-[oklch(0.75_0.18_50)]'
                >
                  <GithubLogoIcon size={16} weight='fill' /> Xem repository
                </Button>
              </Link>
              <Button size='lg' variant='outline'>
                Đọc báo cáo đồ án
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  )
}
