'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface HoverCardTransitionProps {
  children: ReactNode
  delay?: number
  className?: string
}

export default function HoverCardTransition({ 
  children, 
  delay = 0, 
  className = "" 
}: HoverCardTransitionProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: delay }}
      whileHover={{ 
        y: -8, 
        boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)", 
        transition: { duration: 0.2 } 
      }}
    >
      {children}
    </motion.div>
  )
} 