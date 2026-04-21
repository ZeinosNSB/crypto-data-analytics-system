'use client'

import { ArrowRightIcon, GithubLogoIcon } from '@phosphor-icons/react'
import { Button } from '@workspace/web/components/ui/button'
import { motion } from 'motion/react'
import Link from 'next/link'

const metrics = [
  { v: '10K+', l: 'events / sec' },
  { v: '<200ms', l: 'end-to-end latency' },
  { v: '5+', l: 'trading pairs' },
  { v: '99.9%', l: 'uptime mục tiêu' }
]

export default function Hero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className='max-w-3xl'
    >
      <div className='border-border bg-card/60 text-muted-foreground mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs backdrop-blur'>
        <span className='bg-accent h-1.5 w-1.5 animate-pulse rounded-full' />
        Đồ án Big Data · Real-time Crypto Analytics
      </div>
      <h1 className='text-5xl leading-[1.05] font-bold tracking-tight md:text-7xl'>
        Phân tích & xử lý <span className='text-gradient-primary'>Big Data Crypto</span> từ Binance theo{' '}
        <span className='text-gradient-accent'>thời gian thực</span>
      </h1>
      <p className='text-muted-foreground mt-6 max-w-2xl text-lg leading-relaxed'>
        Một pipeline end-to-end gồm Kafka, Spark Streaming, MinIO data lake, MongoDB &amp; Redis, triển khai trên
        Kubernetes — biến hàng nghìn events thị trường mỗi giây thành insight giao dịch trực quan.
      </p>
      <div className='mt-10 flex flex-wrap gap-3'>
        <Button
          size='lg'
          className='from-primary text-primary-foreground animate-pulse-glow gap-2 bg-gradient-to-r to-[oklch(0.75_0.18_50)] hover:opacity-90'
        >
          Khám phá kiến trúc <ArrowRightIcon size={16} weight='bold' />
        </Button>
        <Link href='https://github.com/ZeinosNSB/crypto-data-analytics-system'>
          <Button size='lg' variant='outline' className='gap-2'>
            <GithubLogoIcon size={16} weight='fill' /> Xem source code
          </Button>
        </Link>
      </div>

      <div className='mt-16 grid grid-cols-2 gap-6 md:grid-cols-4'>
        {metrics.map(m => (
          <div key={m.l} className='border-primary/60 border-l-2 pl-4'>
            <div className='text-gradient-primary text-3xl font-bold'>{m.v}</div>
            <div className='text-muted-foreground mt-1 text-xs tracking-wider uppercase'>{m.l}</div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
