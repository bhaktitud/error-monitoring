'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface ButtonTransitionProps {
  children: ReactNode
  delay?: number
  className?: string
  onClick?: () => void
}

export default function ButtonTransition({ 
  children, 
  delay = 0,
  className = "",
  onClick
}: ButtonTransitionProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, delay: delay }}
      whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
} 