'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className='border-border/60 mt-12 border-t'>
      <div className='text-muted-foreground mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm md:flex-row'>
        <div>© {new Date().getFullYear()} CryptoStream — Big Data Final Project</div>
        <div className='flex gap-6'>
          <a href='#' className='hover:text-foreground'>
            Docs
          </a>
          <Link href='https://github.com/ZeinosNSB/crypto-data-analytics-system'>GitHub</Link>
          <a href='#' className='hover:text-foreground'>
            Contact
          </a>
        </div>
      </div>
    </footer>
  )
}
