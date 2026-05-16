'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const timeQuotes = [
  "Time is the most valuable thing we have, and yet we tend to waste it, kill it, and spend it rather than invest it.",
  "The future belongs to those who prepare for it today.",
  "Time flies over us, but leaves its shadow behind.",
  "Yesterday is history, tomorrow is a mystery, today is a gift.",
  "Time is what prevents everything from happening at once.",
  "The trouble is, you think you have time.",
  "Time is a created thing. To say 'I don't have time,' is like saying, 'I don't want to.'",
  "Lost time is never found again.",
  "Time is the coin of your life. It is the only coin you have, and only you can determine how it will be spent.",
  "Time changes everything except something within us which is always surprised by change.",
  "Time is an illusion. Lunchtime doubly so.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "Time you enjoy wasting is not wasted time.",
  "Punctuality is the thief of time.",
  "Time is the fire in which we burn.",
  "Time is a great teacher, but unfortunately it kills all its pupils.",
  "Don't wait for the perfect moment, take the moment and make it perfect.",
  "Time is free, but it's priceless. You can't own it, but you can use it."
]

interface TimeQuotesProps { minimal?: boolean }

export default function TimeQuotes({ minimal }: TimeQuotesProps) {
  const [currentQuote, setCurrentQuote] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev: number) => (prev + 1) % timeQuotes.length)
    }, 8000) // Change quote every 8 seconds

    return () => clearInterval(interval)
  }, [])

  if(minimal){
    return (
      <motion.div
        className="py-4 px-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            className="relative min-h-[3.5rem] flex items-center justify-center"
            key={currentQuote}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <blockquote className="text-sm md:text-base text-neutral-600 dark:text-neutral-300 italic font-light leading-relaxed px-4">
              “{timeQuotes[currentQuote]}”
            </blockquote>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="py-10 px-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 1 }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <motion.h2 
          className="text-sm font-medium tracking-wide text-neutral-500 dark:text-neutral-400 mb-6 uppercase"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >Quotes</motion.h2>
        
        <motion.div 
          className="relative h-28 flex items-center justify-center"
          key={currentQuote}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <blockquote className="text-base md:text-lg text-neutral-600 dark:text-neutral-300 italic font-light leading-relaxed px-4">
            “{timeQuotes[currentQuote]}”
          </blockquote>
        </motion.div>

        <div className="flex justify-center mt-4 space-x-1">
          {timeQuotes.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuote(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${index===currentQuote? 'bg-neutral-900 dark:bg-neutral-100 w-6':'bg-neutral-300 dark:bg-neutral-700 w-2 hover:bg-neutral-400 dark:hover:bg-neutral-600'}`}
            />
          ))}
        </div>

        <motion.button
          onClick={() => setCurrentQuote(Math.floor(Math.random() * timeQuotes.length))}
          className="mt-6 px-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Shuffle Quote
        </motion.button>
      </div>
    </motion.div>
  )
}
