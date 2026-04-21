'use client'

import { GithubLogoIcon } from '@phosphor-icons/react/ssr'
import { Button } from '@workspace/web/components/ui/button'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

const navLinks = [
  { href: '#overview', label: 'Overview' },
  { href: '#architecture', label: 'Architecture' },
  { href: '#features', label: 'Features' },
  { href: '#stack', label: 'Stack' }
]

export default function Header() {
  const [activeSection, setActiveSection] = useState<string>('')
  const [hovered, setHovered] = useState<string | null>(null)
  const lockedSectionRef = useRef<string | null>(null)
  const lockTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    const sectionIds = navLinks.map(l => l.href.slice(1))

    const computeActive = () => {
      if (lockedSectionRef.current) return

      const anchorY = window.innerHeight * 0.25

      let currentId = sectionIds[0]
      let bestDelta = -Infinity

      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (!el) continue
        const top = el.getBoundingClientRect().top
        const delta = top - anchorY
        if (delta <= 0 && delta > bestDelta) {
          bestDelta = delta
          currentId = id
        }
      }

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        currentId = sectionIds[sectionIds.length - 1]
      }

      setActiveSection(`#${currentId}`)
    }

    computeActive()
    window.addEventListener('scroll', computeActive, { passive: true })
    window.addEventListener('resize', computeActive)
    return () => {
      window.removeEventListener('scroll', computeActive)
      window.removeEventListener('resize', computeActive)
      if (lockTimeoutRef.current) window.clearTimeout(lockTimeoutRef.current)
    }
  }, [])

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const target = document.querySelector(href)
    if (!target) return

    setActiveSection(href)
    lockedSectionRef.current = href
    if (lockTimeoutRef.current) window.clearTimeout(lockTimeoutRef.current)
    lockTimeoutRef.current = window.setTimeout(() => {
      lockedSectionRef.current = null
    }, 800)

    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const highlight = hovered ?? activeSection

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className='border-border/60 bg-background/70 sticky top-0 z-40 border-b backdrop-blur-xl'
    >
      <div className='mx-auto flex max-w-7xl items-center justify-between px-6 py-4'>
        {/* Logo */}
        <motion.div
          className='flex items-center gap-2'
          whileHover={{ scale: 1.03 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <div className='from-primary to-accent relative flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br'>
            <Image src='/logo.svg' alt='CryptoStream logo' fill sizes='48px' className='object-contain' priority />
          </div>
        </motion.div>

        {/* Nav */}
        <nav
          onMouseLeave={() => setHovered(null)}
          className='text-muted-foreground relative hidden items-center gap-2 text-sm md:flex'
        >
          {navLinks.map(({ href, label }) => {
            const isActive = activeSection === href
            const isHighlighted = highlight === href
            return (
              <a
                key={href}
                href={href}
                onClick={e => handleNavClick(e, href)}
                onMouseEnter={() => setHovered(href)}
                className={`focus-visible:ring-ring relative rounded-md px-4 py-2 transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none ${
                  isActive ? 'text-foreground font-medium' : 'hover:text-foreground'
                }`}
              >
                <AnimatePresence>
                  {isHighlighted && (
                    <motion.span
                      layoutId='nav-pill'
                      className='bg-primary/10 border-primary/20 absolute inset-0 rounded-md border'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 30,
                        mass: 0.8
                      }}
                    />
                  )}
                </AnimatePresence>
                <span className='relative z-10'>{label}</span>
                {isActive && (
                  <motion.span
                    layoutId='nav-underline'
                    className='via-primary absolute -bottom-px left-1/2 h-px w-6 -translate-x-1/2 bg-gradient-to-r from-transparent to-transparent'
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 30
                    }}
                  />
                )}
              </a>
            )
          })}
        </nav>

        {/* GitHub CTA */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
          <Link href='https://github.com/ZeinosNSB/crypto-data-analytics-system' className='hidden md:block'>
            <Button variant='outline' size='sm' className='gap-2'>
              <GithubLogoIcon className='h-4 w-4' /> GitHub
            </Button>
          </Link>
        </motion.div>
      </div>
    </motion.header>
  )
}
