import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [isFinished, setIsFinished] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => setIsFinished(true), 300)
          setTimeout(() => onComplete(), 1200)
          return 100
        }
        return prev + 1
      })
    }, 25)
    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <motion.div
      className="fixed inset-0 bg-[rgb(15,15,15)] flex justify-center items-center z-[9999]"
      animate={{ opacity: isFinished ? 0 : 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <motion.div
        className="flex flex-col items-end max-md:items-center"
        animate={{
          scale: isFinished ? 15 : 1,
          opacity: isFinished ? 0 : 1,
        }}
        transition={{ duration: 0.6, ease: 'easeIn' }}
      >
        <h1
          className="loading-text-fill text-[80px] max-md:text-[48px] font-[900] m-0 animate-wave"
          style={{ backgroundPositionY: `${progress}%` }}
        >
          SIPETUALANG
        </h1>
        <div className="flex gap-2 text-white text-sm mt-2 font-medium max-md:pr-0 max-md:justify-center pr-2.5">
          <span>Tunggu Sebentar Yaw...</span>
          <span className="tabular-nums w-[35px] text-right">{progress}%</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
