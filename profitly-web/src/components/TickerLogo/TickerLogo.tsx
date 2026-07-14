import { useState } from 'react'
import placeholder from '../../assets/ticker-placeholder.svg'

interface TickerLogoProps {
  src?: string | null
  alt: string
  className?: string
  width?: number
  height?: number
}

/**
 * Ticker logo image with a bundled on-brand fallback. Renders the local
 * placeholder whenever `src` is missing/blank or the remote image fails to load,
 * so assets without a brapi logo (FIIs, funds, treasury...) always show a logo
 * instead of a broken image — independent of the CDN or the DB `logo_url` value.
 */
export function TickerLogo({ src, alt, className, width, height }: TickerLogoProps) {
  const [failed, setFailed] = useState(false)
  const effectiveSrc = !src || failed ? placeholder : src
  return (
    <img
      className={className}
      src={effectiveSrc}
      alt={alt}
      width={width}
      height={height}
      onError={() => { if (!failed) setFailed(true) }}
    />
  )
}
