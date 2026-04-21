'use client'

import {
  ChartBarIcon,
  CloudArrowDownIcon,
  CpuIcon,
  CubeIcon,
  DatabaseIcon,
  GaugeIcon,
  HardDrivesIcon,
  LightningIcon,
  PulseIcon,
  StackIcon
} from '@phosphor-icons/react'
import { AnimatedBeam } from '@workspace/web/components/ui/animated-beam'
import { cn } from '@workspace/web/lib/utils'
import { motion } from 'motion/react'
import { forwardRef, useRef } from 'react'
import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

type Tone = 'yellow' | 'green' | 'blue' | 'violet' | 'slate'

const toneRing: Record<Tone, string> = {
  yellow: 'ring-[oklch(0.82_0.17_85)]/40 bg-[oklch(0.82_0.17_85)]/10 text-[oklch(0.82_0.17_85)]',
  green: 'ring-[oklch(0.7_0.18_165)]/40 bg-[oklch(0.7_0.18_165)]/10 text-[oklch(0.7_0.18_165)]',
  blue: 'ring-[oklch(0.65_0.2_250)]/40 bg-[oklch(0.65_0.2_250)]/10 text-[oklch(0.78_0.14_220)]',
  violet: 'ring-[oklch(0.65_0.2_290)]/40 bg-[oklch(0.65_0.2_290)]/10 text-[oklch(0.75_0.18_290)]',
  slate: 'ring-border bg-muted text-muted-foreground'
}

interface NodeProps {
  icon: PhosphorIcon
  name: string
  sub?: string
  tone?: Tone
  className?: string
}

const Node = forwardRef<HTMLDivElement, NodeProps>(({ icon: Icon, name, sub, tone = 'slate', className }, ref) => (
  <div
    ref={ref}
    className={cn(
      'border-border/70 bg-card/95 hover:border-primary/40 relative z-10 flex w-full min-w-0 items-center gap-3 rounded-xl border px-3.5 py-2.5 shadow-sm backdrop-blur transition-colors',
      className
    )}
  >
    <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1', toneRing[tone])}>
      <Icon width={18} height={18} />
    </div>
    <div className='min-w-0 flex-1'>
      <p className='text-foreground truncate text-[12px] leading-tight font-semibold'>{name}</p>
      {sub && <p className='text-muted-foreground truncate text-[10px] leading-tight'>{sub}</p>}
    </div>
  </div>
))
Node.displayName = 'Node'

const CloudNode = forwardRef<HTMLDivElement, NodeProps>(({ icon: Icon, name, sub, tone = 'yellow' }, ref) => (
  <div className='flex flex-col items-center gap-2'>
    <div
      ref={ref}
      className='border-border/70 bg-card/95 relative z-10 flex h-[88px] w-[88px] items-center justify-center border shadow-sm backdrop-blur'
      style={{ borderRadius: '62% 38% 55% 45% / 55% 45% 55% 45%' }}
    >
      <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl ring-1', toneRing[tone])}>
        <Icon width={20} height={20} />
      </div>
    </div>
    <div className='text-center'>
      <p className='text-foreground text-[12px] leading-tight font-semibold'>{name}</p>
      {sub && <p className='text-muted-foreground text-[10px] leading-tight'>{sub}</p>}
    </div>
  </div>
))
CloudNode.displayName = 'CloudNode'

function LayerLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('text-muted-foreground/70 text-[10px] font-semibold tracking-[0.3em] uppercase', className)}>
      {children}
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className='flex items-center gap-2'>
      <span className='inline-block h-[3px] w-5 rounded-full' style={{ background: color }} />
      <span className='text-muted-foreground text-[10px] tracking-[0.2em] uppercase'>{label}</span>
    </div>
  )
}

function SidebandCard({
  icon: Icon,
  title,
  text,
  tone = 'slate'
}: {
  icon: PhosphorIcon
  title: string
  text: string
  tone?: Tone
}) {
  return (
    <div className='border-border/70 bg-card/60 flex items-center gap-3 rounded-xl border px-4 py-3 backdrop-blur'>
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1', toneRing[tone])}>
        <Icon width={18} height={18} weight='duotone' />
      </div>
      <div className='min-w-0'>
        <p className='text-muted-foreground/70 text-[10px] font-semibold tracking-[0.3em] uppercase'>{title}</p>
        <p className='text-foreground/90 mt-0.5 text-[12px] leading-tight'>{text}</p>
      </div>
    </div>
  )
}

export function ArchitectureFlow() {
  const containerRef = useRef<HTMLDivElement>(null)

  const binanceRef = useRef<HTMLDivElement>(null)
  const collectorRef = useRef<HTMLDivElement>(null)
  const kafkaRef = useRef<HTMLDivElement>(null)
  const minioRef = useRef<HTMLDivElement>(null)
  const pysparkRef = useRef<HTMLDivElement>(null)
  const sparkStreamRef = useRef<HTMLDivElement>(null)
  const mongoRef = useRef<HTMLDivElement>(null)
  const redisRef = useRef<HTMLDivElement>(null)
  const elysiaRef = useRef<HTMLDivElement>(null)
  const nextRef = useRef<HTMLDivElement>(null)

  const yellow = 'oklch(0.82 0.17 85)'
  const green = 'oklch(0.7 0.18 165)'
  const violet = 'oklch(0.65 0.2 290)'
  const blue = 'oklch(0.65 0.2 250)'

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className='border-border from-card/60 to-card/20 relative overflow-hidden rounded-3xl border bg-gradient-to-br p-6 backdrop-blur md:p-10'
    >
      <div className='bg-primary/10 pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full blur-[120px]' />
      <div className='bg-accent/10 pointer-events-none absolute -right-32 -bottom-32 h-80 w-80 rounded-full blur-[120px]' />

      <div className='relative flex flex-col items-center gap-y-12 lg:grid lg:grid-cols-[120px_1fr_160px] lg:items-center lg:gap-x-6'>
        <div className='flex flex-col items-center gap-3'>
          <CloudNode ref={binanceRef} icon={CloudArrowDownIcon} name='Binance' sub='WS + REST' tone='yellow' />
          <LayerLabel>Source</LayerLabel>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className='border-border/70 bg-background/30 relative w-full max-w-[800px] min-w-0 rounded-2xl border-2 border-dashed px-5 py-8 lg:max-w-none'
        >
          <div className='bg-card text-muted-foreground absolute -top-3 left-6 px-2 text-[10px] font-semibold tracking-[0.3em] uppercase'>
            Kubernetes Cluster
          </div>

          <div className='flex flex-col gap-8 md:grid md:grid-cols-[minmax(0,240px)_minmax(0,1fr)] md:items-start md:gap-5'>
            <div className='flex w-full min-w-0 flex-col gap-4'>
              <LayerLabel>Ingestion Layer</LayerLabel>
              <Node ref={collectorRef} icon={PulseIcon} name='Collector' sub='Produce events' tone='blue' />
              <Node ref={kafkaRef} icon={LightningIcon} name='Apache Kafka' sub='Event streaming' tone='green' />
            </div>

            <div className='flex w-full min-w-0 flex-col gap-4'>
              <LayerLabel>Serving Layer</LayerLabel>
              <div className='grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3'>
                <Node ref={mongoRef} icon={DatabaseIcon} name='MongoDB' sub='Aggregated' tone='violet' />
                <Node ref={redisRef} icon={CubeIcon} name='Redis' sub='Hot cache' tone='yellow' />
                <Node ref={elysiaRef} icon={HardDrivesIcon} name='Elysia API' sub='Bun · REST/WS' tone='green' />
              </div>
            </div>
          </div>

          <div className='mt-10 flex w-full min-w-0 flex-col gap-4'>
            <LayerLabel>Processing &amp; Storage</LayerLabel>
            <div className='grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3'>
              <Node ref={minioRef} icon={HardDrivesIcon} name='MinIO' sub='Raw data lake' tone='slate' />
              <Node ref={pysparkRef} icon={CpuIcon} name='PySpark' sub='Batch ETL' tone='green' />
              <Node ref={sparkStreamRef} icon={StackIcon} name='Spark Stream' sub='Real-time wind.' tone='green' />
            </div>
          </div>
        </motion.div>

        <div className='flex w-full flex-col items-center gap-3'>
          <LayerLabel>Presentation</LayerLabel>
          <Node ref={nextRef} icon={ChartBarIcon} name='Next.js' sub='Live dashboard' tone='slate' />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}
        className='relative mt-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-2'
      >
        <SidebandCard
          icon={GaugeIcon}
          title='Observability'
          text='Prometheus · Grafana — metrics & alerts'
          tone='violet'
        />
        <SidebandCard icon={StackIcon} title='Infrastructure' text='Kubernetes · Helm · Docker' tone='blue' />
      </motion.div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={binanceRef}
        toRef={collectorRef}
        gradientStartColor={yellow}
        gradientStopColor={blue}
        speed={90}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={collectorRef}
        toRef={kafkaRef}
        gradientStartColor={blue}
        gradientStopColor={green}
        speed={90}
        delay={0.4}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={kafkaRef}
        toRef={minioRef}
        gradientStartColor={green}
        gradientStopColor={yellow}
        speed={90}
        delay={0.7}
        curvature={30}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={kafkaRef}
        toRef={sparkStreamRef}
        gradientStartColor={green}
        gradientStopColor={green}
        speed={90}
        delay={0.9}
        curvature={40}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={minioRef}
        toRef={pysparkRef}
        gradientStartColor={yellow}
        gradientStopColor={green}
        speed={90}
        delay={1.2}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={pysparkRef}
        toRef={mongoRef}
        gradientStartColor={green}
        gradientStopColor={violet}
        speed={90}
        delay={1.5}
        curvature={-40}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={sparkStreamRef}
        toRef={redisRef}
        gradientStartColor={green}
        gradientStopColor={yellow}
        speed={90}
        delay={1.4}
        curvature={-60}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={mongoRef}
        toRef={elysiaRef}
        gradientStartColor={violet}
        gradientStopColor={green}
        speed={90}
        delay={1.8}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={redisRef}
        toRef={elysiaRef}
        gradientStartColor={yellow}
        gradientStopColor={green}
        speed={90}
        delay={1.9}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={elysiaRef}
        toRef={nextRef}
        gradientStartColor={green}
        gradientStopColor={yellow}
        speed={90}
        delay={2.2}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={nextRef}
        toRef={elysiaRef}
        gradientStartColor={yellow}
        gradientStopColor={green}
        speed={90}
        delay={2.8}
        reverse
        curvature={20}
      />

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.45 }}
        className='border-border/60 relative mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-4'
      >
        <div className='flex flex-wrap items-center gap-5'>
          <Legend color={yellow} label='Source / Cache' />
          <Legend color={green} label='Streaming / Compute' />
          <Legend color={violet} label='Storage' />
          <Legend color={blue} label='Service' />
        </div>
        <p className='text-muted-foreground text-[10px] tracking-[0.25em] uppercase'>
          End-to-end · Fault tolerant · Horizontally scalable
        </p>
      </motion.div>
    </motion.div>
  )
}
