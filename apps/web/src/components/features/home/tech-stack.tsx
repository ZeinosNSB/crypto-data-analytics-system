'use client'

import { cn } from '@workspace/web/lib/utils'
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'motion/react'
import Image from 'next/image'
import type { MouseEvent } from 'react'

type Tech = {
  name: string
  icon: string
  desc: string
}

type Category = {
  label: string
  step: string
  accent: string
  items: Array<Tech>
}

const categories: Array<Category> = [
  {
    label: 'Source & Ingestion',
    step: '01',
    accent: 'oklch(0.82 0.17 85)',
    items: [
      { name: 'Binance', icon: 'https://thesvg.org/icons/binance/default.svg', desc: 'Market data source' },
      { name: 'Apache Kafka', icon: 'https://thesvg.org/icons/apache-kafka/dark.svg', desc: 'Event streaming bus' }
    ]
  },
  {
    label: 'Processing',
    step: '02',
    accent: 'oklch(0.7 0.18 165)',
    items: [
      {
        name: 'Apache Spark',
        icon: 'https://thesvg.org/icons/apache-spark/default.svg',
        desc: 'Batch ETL & analytics'
      },
      { name: 'Spark Streaming', icon: 'https://thesvg.org/icons/apache-spark/default.svg', desc: 'Real-time windows' },
      { name: 'Python', icon: 'https://thesvg.org/icons/python/default.svg', desc: 'PySpark jobs' }
    ]
  },
  {
    label: 'Storage',
    step: '03',
    accent: 'oklch(0.65 0.2 290)',
    items: [
      { name: 'MinIO', icon: 'https://thesvg.org/icons/minio/default.svg', desc: 'S3-compatible data lake' },
      { name: 'MongoDB', icon: 'https://thesvg.org/icons/mongodb/default.svg', desc: 'Aggregated storage' },
      { name: 'Redis', icon: 'https://thesvg.org/icons/redis/default.svg', desc: 'Low-latency cache' }
    ]
  },
  {
    label: 'Serving & UI',
    step: '04',
    accent: 'oklch(0.65 0.2 250)',
    items: [
      { name: 'Elysia', icon: 'https://thesvg.org/icons/elysiajs/default.svg', desc: 'Bun runtime · REST/WS' },
      { name: 'Bun', icon: 'https://thesvg.org/icons/bun/default.svg', desc: 'JS runtime' },
      { name: 'Next.js', icon: 'https://thesvg.org/icons/nextdotjs/default.svg', desc: 'Dashboard frontend' }
    ]
  },
  {
    label: 'Infrastructure & Ops',
    step: '05',
    accent: 'oklch(0.7 0.15 30)',
    items: [
      { name: 'Docker', icon: 'https://thesvg.org/icons/docker/default.svg', desc: 'Containerization' },
      { name: 'Kubernetes', icon: 'https://thesvg.org/icons/kubernetes/default.svg', desc: 'Orchestration' },
      { name: 'Helm', icon: 'https://thesvg.org/icons/helm/default.svg', desc: 'K8s packaging' },
      { name: 'Prometheus', icon: 'https://thesvg.org/icons/prometheus/default.svg', desc: 'Metrics' },
      { name: 'Grafana', icon: 'https://thesvg.org/icons/grafana/default.svg', desc: 'Dashboards & alerts' }
    ]
  }
]

function TechCard({ tech, accent, index, catIndex }: { tech: Tech; accent: string; index: number; catIndex: number }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springX = useSpring(x, { stiffness: 400, damping: 35 })
  const springY = useSpring(y, { stiffness: 400, damping: 35 })

  const rotateX = useTransform(springY, [-50, 50], [8, -8])
  const rotateY = useTransform(springX, [-50, 50], [-8, 8])

  const glare = useMotionTemplate`radial-gradient(90px at calc(50% + ${springX}px) calc(50% + ${springY}px), color-mix(in oklab, ${accent} 30%, transparent), transparent 80%)`

  function onMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    x.set(e.clientX - rect.left - rect.width / 2)
    y.set(e.clientY - rect.top - rect.height / 2)
  }

  function onMouseLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.82, y: 22 },
        show: { opacity: 1, scale: 1, y: 0 }
      }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay: index * 0.08
      }}
      style={{ rotateX, rotateY, transformPerspective: 700 }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className='group border-border/70 bg-card/50 hover:bg-card/80 hover:border-border/90 relative flex cursor-default items-center gap-3 overflow-hidden rounded-xl border px-4 py-3 backdrop-blur select-none'
    >
      <motion.span
        className='pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100'
        style={{ background: glare }}
      />

      <motion.span
        className='pointer-events-none absolute inset-0 -skew-x-12'
        initial={{ x: '-110%', opacity: 1 }}
        whileInView={{ x: '210%', opacity: 1 }}
        viewport={{ once: true }}
        transition={{
          duration: 0.75,
          delay: catIndex * 0.1 + index * 0.08 + 0.25,
          ease: 'easeInOut'
        }}
        style={{
          background: `linear-gradient(105deg, transparent 35%, color-mix(in oklab, ${accent} 28%, white) 50%, transparent 65%)`
        }}
      />

      <div
        className='border-border/60 bg-background/60 relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-transform duration-300 group-hover:scale-110'
        style={{ boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${accent} 22%, transparent)` }}
      >
        <Image src={tech.icon} alt={`${tech.name} logo`} width={24} height={24} className='h-6 w-6 object-contain' />
      </div>

      <div className='relative min-w-0'>
        <div className='truncate text-sm leading-tight font-semibold'>{tech.name}</div>
        <div className='text-muted-foreground mt-0.5 truncate text-[11px]'>{tech.desc}</div>
      </div>
    </motion.div>
  )
}

export default function TechStack() {
  return (
    <div className='relative'>
      <div
        className='pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full opacity-40 blur-[120px]'
        style={{ background: 'oklch(0.7 0.18 165 / 0.25)' }}
      />
      <div
        className='pointer-events-none absolute right-1/4 -bottom-24 h-72 w-72 rounded-full opacity-40 blur-[120px]'
        style={{ background: 'oklch(0.82 0.17 85 / 0.2)' }}
      />

      <div className='relative space-y-5'>
        {categories.map((cat, catIdx) => (
          <motion.div
            key={cat.label}
            initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0 round 16px)' }}
            whileInView={{ opacity: 1, clipPath: 'inset(0 0% 0 0 round 16px)' }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: catIdx * 0.09 }}
            className='border-border/60 bg-card/30 relative grid grid-cols-1 items-start gap-4 overflow-hidden rounded-2xl border p-5 backdrop-blur md:grid-cols-[220px_1fr] md:gap-8 md:p-6'
          >
            <motion.div
              className='absolute top-0 left-0 h-[2px] w-full origin-left rounded-full'
              style={{
                background: `linear-gradient(90deg, ${cat.accent}, color-mix(in oklab, ${cat.accent} 30%, transparent))`
              }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: catIdx * 0.09 + 0.2, ease: [0.22, 1, 0.36, 1] }}
            />

            <div className='flex items-center gap-3 md:flex-col md:items-start md:gap-2'>
              <div className='flex items-center gap-2'>
                <motion.span
                  className='inline-block h-2 w-2 rounded-full'
                  style={{ background: cat.accent, boxShadow: `0 0 10px ${cat.accent}` }}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.75, 1, 0.75] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: catIdx * 0.25 }}
                />

                <motion.span
                  className='text-muted-foreground/80 inline-block text-[10px] font-semibold tracking-[0.3em] uppercase'
                  initial={{ opacity: 0, rotateX: -90, y: 6 }}
                  whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: catIdx * 0.09 + 0.15, ease: 'easeOut' }}
                  style={{ transformPerspective: 300, display: 'inline-block' }}
                >
                  {cat.step}
                </motion.span>
              </div>

              <motion.div
                className='text-foreground/90 text-[13px] font-semibold tracking-wide md:text-sm'
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: catIdx * 0.09 + 0.22, ease: 'easeOut' }}
              >
                {cat.label}
              </motion.div>
            </div>

            <motion.div
              className={cn(
                'grid gap-3',
                'grid-cols-1 sm:grid-cols-2',
                cat.items.length >= 3 && 'lg:grid-cols-3',
                cat.items.length >= 4 && 'xl:grid-cols-4',
                cat.items.length >= 5 && '2xl:grid-cols-5'
              )}
              initial='hidden'
              whileInView='show'
              viewport={{ once: true, margin: '-50px' }}
            >
              {cat.items.map((t, i) => (
                <TechCard key={t.name + t.icon} tech={t} accent={cat.accent} index={i} catIndex={catIdx} />
              ))}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
