
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question, PdfLanguage } from '../types';

interface QuestionCardProps {
  question: Question;
  lang: 'en' | 'od';
  index: number;
  autoShowSolution?: boolean;
  pdfLanguage?: PdfLanguage;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  lang, 
  index, 
  autoShowSolution = false,
  pdfLanguage = 'both'
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showSolution, setShowSolution] = useState(autoShowSolution);

  useEffect(() => {
    if (autoShowSolution) {
      setShowSolution(true);
    }
  }, [autoShowSolution]);

  const correctOptionLabel = String.fromCharCode(65 + question.correctOptionIndex);
  const solutionVisible = showSolution || selectedOption !== null;

  // Determine visibility based on UI lang or PDF settings
  const showEn = pdfLanguage === 'both' || pdfLanguage === 'en';
  const showOd = pdfLanguage === 'both' || pdfLanguage === 'od';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      className="question-card bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8 transition-all hover:shadow-md"
    >
      {/* Question Header */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider">
            {lang === 'od' ? 'ପ୍ରଶ୍ନ' : 'Question'} {index + 1}
          </span>
          <span className="text-slate-400 text-xs italic no-print">
            JT Exam Standard
          </span>
        </div>

        {/* Question Text */}
        <div className="mb-6 space-y-2">
          {showEn && (
            <h3 className="text-lg font-bold text-slate-800 leading-relaxed">
              {question.questionEn}
            </h3>
          )}
          {showOd && (
            <h3 className="text-xl font-semibold text-indigo-900 leading-relaxed odia-font border-l-4 border-indigo-100 pl-4">
              {question.questionOd}
            </h3>
          )}
        </div>

        {/* Options List */}
        <div className="space-y-4">
          {question.optionsEn.map((optionEn, idx) => {
            const optionOd = question.optionsOd[idx];
            let variantClasses = "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50";
            
            if (solutionVisible) {
              if (idx === question.correctOptionIndex) {
                variantClasses = "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-200 ring-offset-1";
              } else if (idx === selectedOption) {
                variantClasses = "border-rose-500 bg-rose-50 text-rose-800";
              } else {
                variantClasses = "border-slate-200 opacity-50";
              }
            }

            return (
              <motion.button
                key={idx}
                disabled={solutionVisible}
                whileTap={{ scale: solutionVisible ? 1 : 0.98 }}
                onClick={() => setSelectedOption(idx)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-start group ${variantClasses}`}
              >
                <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-current mr-4 font-black text-sm ${solutionVisible && idx === question.correctOptionIndex ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-900'}`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <div className="flex-1 space-y-1">
                  {showEn && <p className="font-bold text-slate-950">{optionEn}</p>}
                  {showOd && <p className="font-bold text-slate-950 odia-font text-lg leading-tight">{optionOd}</p>}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Reveal Toggle for Web */}
        {!autoShowSolution && (
          <div className="mt-6 flex justify-between items-center no-print">
            {!solutionVisible ? (
              <motion.button 
                whileHover={{ x: 5 }}
                onClick={() => setShowSolution(true)}
                className="text-indigo-600 text-sm font-bold hover:text-indigo-800 flex items-center group"
              >
                <svg className="w-4 h-4 mr-1 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                {lang === 'od' ? 'ଉତ୍ତର ଦେଖନ୍ତୁ' : 'Show Solution'}
              </motion.button>
            ) : (
              <div className="flex items-center text-slate-500 text-xs italic">
                <svg className="w-4 h-4 mr-1 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                {lang === 'od' ? 'ସମାଧାନ ତଳେ ଦିଆଯାଇଛି' : 'Solution displayed below'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Solution Section */}
      <AnimatePresence>
        {solutionVisible && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className={`border-t-2 border-dashed border-indigo-100 bg-indigo-50/20 overflow-hidden print:block`}
          >
            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-2 text-indigo-900 font-extrabold text-sm uppercase tracking-tighter border-b border-indigo-200 pb-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                <span>{showEn && showOd ? 'Detailed Explanation / ବିସ୍ତୃତ ବ୍ୟାଖ୍ୟା' : showEn ? 'Detailed Explanation' : 'ବିସ୍ତୃତ ବ୍ୟାଖ୍ୟା'}</span>
              </div>

              {/* Correct Answer Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {showEn && (
                  <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm ring-1 ring-emerald-50">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                      Correct Answer (EN)
                    </p>
                    <p className="font-bold text-slate-950">Option {correctOptionLabel}: {question.optionsEn[question.correctOptionIndex]}</p>
                  </div>
                )}
                {showOd && (
                  <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm ring-1 ring-emerald-50 odia-font">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1 flex items-center">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                      ସଠିକ୍ ଉତ୍ତର (ଓଡ଼ିଆ)
                    </p>
                    <p className="font-bold text-slate-950 text-lg">ବିକଳ୍ପ {correctOptionLabel}: {question.optionsOd[question.correctOptionIndex]}</p>
                  </div>
                )}
              </div>

              {/* Detailed Explanation Row - HIGHLIGHTED */}
              <div className="space-y-4">
                {showEn && (
                  <div className="relative pl-6 py-3 border-l-4 border-amber-400 bg-amber-50 rounded-r-lg shadow-sm">
                    <p className="text-[10px] font-bold text-amber-700 uppercase mb-2 tracking-widest">Logic & Concept (English)</p>
                    <p className="text-sm text-slate-950 leading-relaxed font-bold bg-amber-100/50 px-1">
                      {question.explanationEn}
                    </p>
                  </div>
                )}
                {showOd && (
                  <div className="relative pl-6 py-3 border-l-4 border-amber-400 bg-amber-50 rounded-r-lg shadow-sm odia-font">
                    <p className="text-[10px] font-bold text-amber-700 uppercase mb-2 tracking-widest">ଯୁକ୍ତି ଏବଂ ଧାରଣା (ଓଡ଼ିଆ)</p>
                    <p className="text-sm text-slate-950 leading-relaxed font-bold text-lg bg-amber-100/50 px-1">
                      {question.explanationOd}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
