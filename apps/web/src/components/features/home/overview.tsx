'use client'

import { ChartLineIcon, CloudArrowDownIcon, CpuIcon, DatabaseIcon } from '@phosphor-icons/react'
import { motion } from 'motion/react'

const overviewCards = [
  { icon: CloudArrowDownIcon, t: 'Ingest', d: 'WebSocket Binance' },
  { icon: CpuIcon, t: 'Process', d: 'Spark batch + stream' },
  { icon: DatabaseIcon, t: 'Store', d: 'MinIO · Mongo · Redis' },
  { icon: ChartLineIcon, t: 'Serve', d: 'Elysia API + Next.js' }
]

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 }
}

const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

export default function Overview() {
  return (
    <section id='overview' className='mx-auto max-w-7xl px-6 py-24'>
      <div className='grid items-start gap-12 md:grid-cols-2'>
        <motion.div
          variants={staggerContainer}
          initial='hidden'
          whileInView='show'
          viewport={{ once: true, margin: '-80px' }}
        >
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className='text-accent mb-4 text-xs font-semibold tracking-[0.25em] uppercase'
          >
            01 · Bối cảnh
          </motion.div>

          <motion.h2
            variants={fadeUp}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className='mb-6 text-4xl font-bold tracking-tight'
          >
            Thị trường crypto = <span className='text-gradient-accent'>dữ liệu khổng lồ</span>, biến động từng mili-giây
          </motion.h2>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className='text-muted-foreground leading-relaxed'
          >
            Mỗi giây Binance phát hàng chục nghìn sự kiện trade, depth update, ticker. Để phân tích, cảnh báo và đưa ra
            quyết định kịp thời, cần một hệ thống Big Data chịu tải lớn, có khả năng xử lý cả batch lẫn streaming.
          </motion.p>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className='text-muted-foreground mt-4 leading-relaxed'
          >
            Đồ án xây dựng một pipeline hoàn chỉnh — từ ingestion → lakehouse → realtime analytics → API serving →
            dashboard — chạy trên Kubernetes cluster với đầy đủ monitoring.
          </motion.p>
        </motion.div>

        <motion.div
          className='grid grid-cols-2 gap-4'
          variants={staggerContainer}
          initial='hidden'
          whileInView='show'
          viewport={{ once: true, margin: '-80px' }}
        >
          {overviewCards.map(c => (
            <motion.div
              key={c.t}
              variants={fadeUp}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className='border-border bg-card/60 hover:border-primary/50 rounded-xl border p-5 backdrop-blur transition-colors'
            >
              <c.icon size={24} weight='duotone' className='text-primary mb-3' />
              <div className='font-semibold'>{c.t}</div>
              <div className='text-muted-foreground mt-1 text-xs'>{c.d}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
