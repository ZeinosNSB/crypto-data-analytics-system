'use client'

import {
  ChartLineIcon,
  DatabaseIcon,
  LightningIcon,
  PulseIcon,
  ShieldCheckIcon,
  StackIcon
} from '@phosphor-icons/react'
import { motion } from 'motion/react'

const features = [
  {
    icon: PulseIcon,
    title: 'Real-time ingestion',
    desc: 'Stream live trades, order books và tickers từ Binance qua WebSocket, đẩy thẳng vào Kafka topics có partition theo symbol.'
  },
  {
    icon: DatabaseIcon,
    title: 'Lakehouse architecture',
    desc: 'MinIO làm data lake cho raw events; PySpark batch jobs ghi ra Parquet phân vùng theo ngày để phân tích lịch sử quy mô lớn.'
  },
  {
    icon: LightningIcon,
    title: 'Streaming analytics',
    desc: 'Spark Structured Streaming tính VWAP, biến động, momentum trong cửa sổ trượt 1s–5m và đẩy kết quả xuống Redis.'
  },
  {
    icon: ChartLineIcon,
    title: 'Insights dashboard',
    desc: 'Next.js dashboard hiển thị biểu đồ nến, độ sâu thị trường, alerts và backtest signals theo thời gian thực.'
  },
  {
    icon: StackIcon,
    title: 'Cloud-native',
    desc: 'Toàn bộ workload đóng gói Docker, deploy bằng Helm chart trên Kubernetes — auto-scale theo throughput của Kafka.'
  },
  {
    icon: ShieldCheckIcon,
    title: 'Observability-first',
    desc: 'Prometheus thu thập metrics từng service, Grafana dashboard cảnh báo lag, throughput, latency end-to-end.'
  }
]

export default function Features() {
  return features.map((f, i) => (
    <motion.div
      key={f.title}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: i * 0.05 }}
      className='group border-border bg-card/60 hover:border-primary/50 hover:bg-card/90 rounded-2xl border p-6 backdrop-blur transition'
    >
      <div className='bg-primary/15 text-primary mb-4 flex h-11 w-11 items-center justify-center rounded-lg transition group-hover:scale-110'>
        <f.icon size={20} weight='duotone' />
      </div>
      <h3 className='mb-2 text-lg font-semibold'>{f.title}</h3>
      <p className='text-muted-foreground text-sm leading-relaxed'>{f.desc}</p>
    </motion.div>
  ))
}
