'use client';

import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

interface PageTransitionProps {
  children: React.ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()

  const [currentKey, setCurrentKey] = useState(pathname)
  const [exitingNode, setExitingNode] = useState<React.ReactNode | null>(null)
  const [currentNode, setCurrentNode] = useState<React.ReactNode>(children)
  const currentNodeRef = useRef<React.ReactNode>(children)
  const nextNodeRef = useRef<React.ReactNode | null>(null)

  // Detect route change: capture previous node to exit and hold the next node
  useEffect(() => {
    if (pathname !== currentKey) {
      setExitingNode(currentNodeRef.current)
      nextNodeRef.current = children
    } else {
      // Same route, just update current snapshot
      setCurrentNode(children)
      currentNodeRef.current = children
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, children])

  const handleExitComplete = () => {
    if (nextNodeRef.current) {
      setCurrentNode(nextNodeRef.current)
      currentNodeRef.current = nextNodeRef.current
      nextNodeRef.current = null
      setExitingNode(null)
      setCurrentKey(pathname)
    }
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AnimatePresence mode="wait" onExitComplete={handleExitComplete} initial={false}>
        {exitingNode && (
          <motion.div
            key={`exit-${currentKey}`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            {exitingNode}
          </motion.div>
        )}
      </AnimatePresence>

      {!exitingNode && (
        <motion.div
          key={`enter-${currentKey}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          style={{ width: '100%', height: '100%' }}
        >
          {currentNode}
        </motion.div>
      )}
    </div>
  )
}


