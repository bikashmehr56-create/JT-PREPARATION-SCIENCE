
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flashcard } from '../types';

interface FlashcardSetProps {
  flashcards: Flashcard[];
}

export const FlashcardSet: React.FC<FlashcardSetProps> = ({ flashcards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0);

  if (flashcards.length === 0) return null;

  const currentCard = flashcards[currentIndex];

  const handleNext = () => {
    setDirection(1);
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9
    })
  };

  return (
    <div className="flex flex-col items-center space-y-8 py-10 overflow-hidden">
      <div className="flex items-center justify-between w-full max-w-lg mb-4 text-slate-500 font-bold text-xs uppercase tracking-widest px-4">
        <span>Concept {currentIndex + 1} of {flashcards.length}</span>
        <motion.span 
          key={currentCard.conceptCategory}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded"
        >
          {currentCard.conceptCategory || 'Revision'}
        </motion.span>
      </div>

      <div className="relative w-full max-w-lg h-80 md:h-96">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div 
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="absolute inset-0 flashcard-container group cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className={`flashcard-inner relative w-full h-full text-center transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
              
              {/* Front of Card */}
              <div className="flashcard-front absolute inset-0 w-full h-full backface-hidden bg-white border-2 border-slate-200 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 space-y-6">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{currentCard.termEn}</h2>
                <h2 className="text-3xl font-bold text-indigo-900 odia-font">{currentCard.termOd}</h2>
                <p className="absolute bottom-6 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] animate-pulse">Click to Reveal Definition</p>
              </div>

              {/* Back of Card */}
              <div className="flashcard-back absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-slate-900 border-2 border-indigo-500/50 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-10 overflow-y-auto custom-scrollbar">
                <div className="space-y-6 w-full">
                  <div className="space-y-2">
                    <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest text-left">Definition (EN)</p>
                    <p className="text-white text-lg font-medium leading-relaxed text-left">{currentCard.definitionEn}</p>
                  </div>
                  <div className="h-px bg-slate-800 w-full"></div>
                  <div className="space-y-2 odia-font">
                    <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest text-left">ବ୍ୟାଖ୍ୟା (ଓଡ଼ିଆ)</p>
                    <p className="text-slate-200 text-xl font-medium leading-relaxed text-left">{currentCard.definitionOd}</p>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center space-x-6 z-10">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-indigo-600 shadow-md transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-white hover:bg-indigo-600 shadow-xl transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </motion.button>
      </div>

      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Tip: Use flashcards for 5 minutes daily to boost memory</p>
    </div>
  );
};
