'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface SectionTransitionProps {
  children: ReactNode
  delay?: number
  className?: string
}

export default function SectionTransition({ 
  children, 
  delay = 0, 
  className = "" 
}: SectionTransitionProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: delay }}
    >
      {children}
    </motion.div>
  )
} 