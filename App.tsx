
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Category, AppState, Question, Flashcard, FileData, ViewMode, PdfLanguage } from './types';
import { SYLLABUS_DATA } from './constants';
import { generatePracticeQuestions, generateFlashcards } from './services/geminiService';
import { QuestionCard } from './components/QuestionCard';
import { FlashcardSet } from './components/FlashcardSet';

const PDF_STEPS = [
  "Structuring curriculum content...",
  "Applying bilingual styling...",
  "Rendering script glyphs...",
  "Finalizing document snapshot...",
  "Initiating file download..."
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    category: Category.CAT_I,
    selectedSectionId: SYLLABUS_DATA[Category.CAT_I][0].id,
    questions: [],
    flashcards: [],
    viewMode: ViewMode.QUIZ,
    loading: false,
    error: null,
    language: 'en',
    uploadedFile: null,
    studyMode: true,
    pdfConfig: {
      language: 'both',
      startRange: 1,
      endRange: 20
    }
  });

  const [pdfPrepStep, setPdfPrepStep] = useState<number>(-1);
  const [showPdfSettings, setShowPdfSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async (sectionId: string, category: Category, mode: ViewMode, fileToUse?: FileData | null) => {
    const section = SYLLABUS_DATA[category].find(s => s.id === sectionId);
    if (!section) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const activeFile = fileToUse !== undefined ? fileToUse : state.uploadedFile;
      
      if (mode === ViewMode.QUIZ) {
        const qs = await generatePracticeQuestions(section.title, section.topics, category, activeFile);
        setState(prev => ({ 
          ...prev, 
          questions: qs, 
          loading: false,
          pdfConfig: { ...prev.pdfConfig, endRange: qs.length }
        }));
      } else {
        const cards = await generateFlashcards(section.title, section.topics, category, activeFile);
        setState(prev => ({ ...prev, flashcards: cards, loading: false }));
      }
    } catch (err: any) {
      console.error("Error fetching data:", err);
      let errorMessage = "Failed to load content. Please check connection and try again.";
      if (err?.message === "API_KEY_MISSING") {
        errorMessage = "API key is missing. Please configure your GEMINI_API_KEY in Netlify environment variables and redeploy.";
      } else if (err?.message === "API_KEY_INVALID") {
        errorMessage = "API key is invalid. Please check your GEMINI_API_KEY in Netlify environment variables.";
      } else if (err?.message === "RATE_LIMIT_EXCEEDED") {
        errorMessage = "You are generating too fast! The free tier allows 5 requests per minute. Please wait 30 seconds and try again.";
      } else if (err?.message) {
        errorMessage = err.message;
      }
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
    }
  }, [state.uploadedFile]);

  useEffect(() => {
    fetchData(state.selectedSectionId, state.category, state.viewMode);
  }, []);

  const handleCategoryChange = (cat: Category) => {
    const firstSectionId = SYLLABUS_DATA[cat][0].id;
    setState(prev => ({ ...prev, category: cat, selectedSectionId: firstSectionId }));
    fetchData(firstSectionId, cat, state.viewMode);
  };

  const handleSectionChange = (id: string) => {
    setState(prev => ({ ...prev, selectedSectionId: id }));
    fetchData(id, state.category, state.viewMode);
  };

  const toggleViewMode = (mode: ViewMode) => {
    if (mode === state.viewMode) return;
    setState(prev => ({ ...prev, viewMode: mode }));
    
    if ((mode === ViewMode.QUIZ && state.questions.length === 0) || 
        (mode === ViewMode.FLASHCARDS && state.flashcards.length === 0)) {
      fetchData(state.selectedSectionId, state.category, mode);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Only PDF files are supported for analysis.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      const newFileData = {
        data: base64,
        mimeType: file.type,
        name: file.name
      };
      setState(prev => ({ ...prev, uploadedFile: newFileData, questions: [], flashcards: [] }));
      fetchData(state.selectedSectionId, state.category, state.viewMode, newFileData);
    };
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    setState(prev => ({ ...prev, uploadedFile: null, questions: [], flashcards: [] }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    fetchData(state.selectedSectionId, state.category, state.viewMode, null);
  };

  const startHTMLProcess = async () => {
    const targetQuestions = state.questions.slice(state.pdfConfig.startRange - 1, state.pdfConfig.endRange);
    if (targetQuestions.length === 0) {
      alert("Please generate questions before exporting.");
      return;
    }

    setShowPdfSettings(false);
    const currentSection = SYLLABUS_DATA[state.category].find(s => s.id === state.selectedSectionId);
    
    const showEn = state.pdfConfig.language === 'both' || state.pdfConfig.language === 'en';
    const showOd = state.pdfConfig.language === 'both' || state.pdfConfig.language === 'od';

    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>JT_Practice_Set_${currentSection?.title || 'Exam'}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Noto+Sans+Oriya:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1e293b; max-width: 850px; margin: 40px auto; padding: 20px; background: #f1f5f9; }
        .odia-font { font-family: 'Noto Sans Oriya', sans-serif; }
        .header { background: #1e293b; color: white; padding: 30px; text-align: center; border-radius: 12px; margin-bottom: 40px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .header h1 { margin: 0; font-size: 24pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
        .header p { margin: 10px 0 0; font-size: 14pt; color: #94a3b8; font-weight: 600; }
        .card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; margin-bottom: 30px; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); }
        .q-num { color: #6366f1; font-weight: 800; font-size: 10pt; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px; display: block;}
        .q-text { font-size: 14pt; font-weight: 700; margin-bottom: 15px; color: #0f172a; line-height: 1.4; }
        .q-odia { font-size: 15pt; font-weight: 600; color: #1e1b4b; border-left: 5px solid #6366f1; padding-left: 15px; margin-bottom: 25px; }
        .options { margin-bottom: 25px; }
        .option { display: flex; align-items: flex-start; margin-bottom: 12px; padding: 12px; border-radius: 8px; border: 1px solid #f1f5f9; }
        .opt-label { width: 35px; font-weight: 900; color: #000000; font-size: 12pt; margin-top: 2px; }
        .opt-content { flex: 1; }
        .opt-en { font-weight: 800; color: #000000; font-size: 11pt; }
        .opt-od { font-weight: 800; color: #000000; font-size: 12pt; margin-top: 2px; }
        .explanation { background: #fffcf0; padding: 24px; border-radius: 10px; border: 1px solid #fef3c7; margin-top: 25px; border-left: 6px solid #fbbf24; }
        .ans-label { font-weight: 800; color: #d97706; font-size: 10pt; text-transform: uppercase; margin-bottom: 8px; display: block; border-bottom: 1px solid #fef3c7; padding-bottom: 5px; }
        .ans-val { font-size: 13pt; font-weight: 800; color: #000000; margin-bottom: 12px; display: block; }
        .expl-text { font-size: 11pt; color: #000000; margin-bottom: 8px; font-weight: 800; background: #fef9c3; padding: 2px 4px; display: inline; line-height: 1.8; }
        .expl-odia { font-size: 12pt; color: #000000; margin-top: 5px; font-weight: 800; background: #fef9c3; padding: 2px 4px; display: inline; line-height: 1.8; }
        .footer { text-align: center; margin-top: 50px; color: #94a3b8; font-size: 10pt; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        @media print { body { background: white; margin: 0; padding: 0; } .card { box-shadow: none; border: 1px solid #eee; page-break-inside: avoid; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>Odisha Junior Teacher Practice Set</h1>
        <p>${currentSection?.title} - ${state.category}</p>
        <div style="margin-top: 15px; font-size: 10pt; color: #64748b;">Generated: ${new Date().toLocaleDateString()}</div>
    </div>
    <div id="questions">
        ${targetQuestions.map((q, idx) => `
            <div class="card">
                <span class="q-num">Question ${(state.pdfConfig.startRange - 1) + idx + 1}</span>
                ${showEn ? `<div class="q-text">${q.questionEn}</div>` : ''}
                ${showOd ? `<div class="q-odia odia-font">${q.questionOd}</div>` : ''}
                
                <div class="options">
                    ${q.optionsEn.map((optEn, optIdx) => `
                        <div class="option">
                            <span class="opt-label">${String.fromCharCode(65 + optIdx)}.</span>
                            <div class="opt-content">
                                ${showEn ? `<div class="opt-en">${optEn}</div>` : ''}
                                ${showOd ? `<div class="opt-od odia-font">${q.optionsOd[optIdx]}</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="explanation">
                    <span class="ans-label">Detailed Answer Analysis</span>
                    <span class="ans-val">Correct Option: ${String.fromCharCode(65 + q.correctOptionIndex)}</span>
                    ${showEn ? `<div><span class="expl-text">${q.explanationEn}</span></div>` : ''}
                    ${showOd ? `<div style="margin-top:10px;"><span class="expl-odia odia-font">${q.explanationOd}</span></div>` : ''}
                </div>
            </div>
        `).join('')}
    </div>
    <div class="footer">
        Generated via Junior Teacher Prep Bilingual Hub &bull; SCERT Syllabus Aligned
    </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JT_Practice_Set_${(currentSection?.title || 'Exam').replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const startPDFProcess = async () => {
    const targetQuestions = state.questions.slice(state.pdfConfig.startRange - 1, state.pdfConfig.endRange);
    
    if (targetQuestions.length === 0) {
      alert("Please generate questions before exporting.");
      return;
    }

    setShowPdfSettings(false);
    setPdfPrepStep(0);

    const currentSection = SYLLABUS_DATA[state.category].find(s => s.id === state.selectedSectionId);
    const exportContainer = document.getElementById('pdf-export-container');
    if (!exportContainer) return;

    const contentHtml = `
      <div style="background: white; color: black; padding: 20px;">
        <div class="pdf-header">
          <h1 style="font-size: 22pt; font-weight: 800; text-transform: uppercase; margin-bottom: 8px; color: #1e293b;">ODISHA JUNIOR TEACHER EXAM</h1>
          <p style="font-size: 14pt; font-weight: 700; margin-bottom: 20px; color: #4f46e5;">Subject Set: ${currentSection?.title || 'Practice Paper'}</p>
          <div style="display: flex; justify-content: space-between; font-size: 11pt; font-weight: bold; border-top: 2px solid #e2e8f0; padding-top: 15px;">
             <span>Recruitment: JT (Schematic)</span>
             <span>Category: ${state.category.split(' ')[0]}</span>
             <span>Total Items: ${targetQuestions.length}</span>
          </div>
        </div>
        
        <div id="pdf-content">
          ${targetQuestions.map((q, idx) => {
            const showEn = state.pdfConfig.language === 'both' || state.pdfConfig.language === 'en';
            const showOd = state.pdfConfig.language === 'both' || state.pdfConfig.language === 'od';
            const realIdx = (state.pdfConfig.startRange - 1) + idx + 1;

            return `
              <div class="pdf-question-card">
                <div style="margin-bottom: 12px; font-weight: 800; color: #6366f1; font-size: 10pt;">
                  QUESTION ${realIdx}
                </div>
                
                <div style="margin-bottom: 20px;">
                  ${showEn ? `<div style="font-size: 13pt; font-weight: 700; margin-bottom: 8px; color: #0f172a;">${q.questionEn}</div>` : ''}
                  ${showOd ? `<div class="odia-font" style="font-size: 15pt; font-weight: 600; color: #1e1b4b; border-left: 4px solid #indigo; padding-left: 12px; margin-top: 5px;">${q.questionOd}</div>` : ''}
                </div>

                <div style="margin-bottom: 20px;">
                  ${q.optionsEn.map((optEn, optIdx) => {
                    const optOd = q.optionsOd[optIdx];
                    const label = String.fromCharCode(65 + optIdx);
                    return `
                      <div style="display: flex; margin-bottom: 10px;">
                        <span style="width: 30px; font-weight: 900; color: #000000;">${label}.</span>
                        <div style="flex: 1;">
                          ${showEn ? `<div style="font-weight: 800; font-size: 11pt; color: #000000;">${optEn}</div>` : ''}
                          ${showOd ? `<div class="odia-font" style="font-weight: 800; font-size: 12pt; color: #000000;">${optOd}</div>` : ''}
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>

                <div style="background: #fffcf0; padding: 15px; border-radius: 8px; border: 1px solid #fef3c7; border-left: 5px solid #fbbf24;">
                  <div style="font-size: 9pt; font-weight: 800; color: #d97706; text-transform: uppercase; margin-bottom: 8px;">Analysis & Highlights</div>
                  <div style="font-weight: 800; color: #000000; margin-bottom: 10px; font-size: 12pt;">Correct: ${String.fromCharCode(65 + q.correctOptionIndex)}</div>
                  ${showEn ? `<p style="font-size: 11pt; color: #000000; margin-bottom: 6px; line-height: 1.5; font-weight: 800; background: #fef9c3;">${q.explanationEn}</p>` : ''}
                  ${showOd ? `<p class="odia-font" style="font-size: 12pt; color: #000000; line-height: 1.5; font-weight: 800; background: #fef9c3;">${q.explanationOd}</p>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
        
        <div style="text-align: center; margin-top: 40px; font-size: 10pt; color: #94a3b8; font-weight: 600; border-top: 1px solid #f1f5f9; padding-top: 20px;">
          Practice Paper Generated via Junior Teacher Prep Bilingual Hub
        </div>
      </div>
    `;

    exportContainer.innerHTML = contentHtml;
    setPdfPrepStep(1);

    await new Promise(r => setTimeout(r, 1500));
    setPdfPrepStep(2);

    try {
      if (document.fonts) await document.fonts.ready;
    } catch (e) {}
    
    setPdfPrepStep(3);

    const fileName = `Odisha_JT_Set_${(currentSection?.title || 'Exam').replace(/\s+/g, '_')}.pdf`;
    
    const opt = {
      margin: 10,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        logging: false,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    setPdfPrepStep(4);

    try {
      const element = document.getElementById('pdf-export-container');
      if (element) {
        await (window as any).html2pdf().set(opt).from(element).save();
      }
    } catch (err) {
      console.error("PDF Export Failure:", err);
      alert("Failed to build PDF. Attempting fallback HTML generation...");
      startHTMLProcess();
    } finally {
      setPdfPrepStep(-1);
      if (exportContainer) exportContainer.innerHTML = '';
    }
  };

  const currentSection = SYLLABUS_DATA[state.category].find(s => s.id === state.selectedSectionId);
  const filteredQuestions = state.questions.slice(state.pdfConfig.startRange - 1, state.pdfConfig.endRange);

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-x-hidden">
      {/* PDF PREPARATION OVERLAY */}
      <AnimatePresence>
        {pdfPrepStep >= 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] glass-prep flex items-center justify-center p-6 text-white"
          >
            <div className="max-w-md w-full bg-slate-900 rounded-3xl p-8 border border-slate-700 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: `${((pdfPrepStep + 1) / PDF_STEPS.length) * 100}%` }}
                  className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                />
              </div>

              <div className="flex flex-col items-center">
                <div className="w-16 h-16 mb-6 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                  <motion.svg 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </motion.svg>
                </div>

                <h2 className="text-xl font-black mb-1">Generating PDF Document</h2>
                <p className="text-slate-400 text-sm mb-8">Capturing Odia scripts & formatting...</p>

                <div className="w-full space-y-3">
                  {PDF_STEPS.map((step, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0.3 }}
                      animate={{ 
                        opacity: idx === pdfPrepStep ? 1 : idx < pdfPrepStep ? 0.6 : 0.2,
                        scale: idx === pdfPrepStep ? 1.05 : 1
                      }}
                      className="flex items-center space-x-3 text-xs font-bold"
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${idx < pdfPrepStep ? 'bg-emerald-500' : idx === pdfPrepStep ? 'bg-indigo-400 animate-pulse ring-4 ring-indigo-400/20' : 'bg-slate-700'}`}>
                        {idx < pdfPrepStep ? (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                        ) : <span className="text-[8px]">{idx + 1}</span>}
                      </div>
                      <span className={idx === pdfPrepStep ? 'text-white' : 'text-slate-500'}>{step}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF SETTINGS MODAL */}
      <AnimatePresence>
        {showPdfSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 no-print"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-200"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Export Options</h3>
                  <p className="text-xs text-slate-500 font-bold">Customize your offline practice materials</p>
                </div>
                <button onClick={() => setShowPdfSettings(false)} className="text-slate-400 hover:text-rose-500 p-2 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest">Language Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['both', 'en', 'od'] as PdfLanguage[]).map(l => (
                      <button
                        key={l}
                        onClick={() => setState(p => ({ ...p, pdfConfig: { ...p.pdfConfig, language: l }}))}
                        className={`py-3 px-3 text-xs font-bold rounded-xl border-2 transition-all ${state.pdfConfig.language === l ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'border-slate-100 text-slate-500 hover:border-indigo-100 bg-slate-50'}`}
                      >
                        {l === 'both' ? 'Bilingual' : l === 'en' ? 'English' : 'Odia'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest">Question Range (Available: {state.questions.length})</label>
                  <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-400 mb-1 font-bold">START AT</p>
                      <input 
                        type="number" 
                        min="1" 
                        max={state.questions.length}
                        value={state.pdfConfig.startRange}
                        onChange={(e) => setState(p => ({ ...p, pdfConfig: { ...p.pdfConfig, startRange: Math.max(1, parseInt(e.target.value) || 1)}}))}
                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-500 outline-none transition-colors"
                      />
                    </div>
                    <div className="flex-shrink-0 pt-4 text-slate-300">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-400 mb-1 font-bold">END AT</p>
                      <input 
                        type="number" 
                        min={state.pdfConfig.startRange} 
                        max={state.questions.length}
                        value={state.pdfConfig.endRange}
                        onChange={(e) => setState(p => ({ ...p, pdfConfig: { ...p.pdfConfig, endRange: Math.min(state.questions.length, parseInt(e.target.value) || state.questions.length)}}))}
                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-500 outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={startPDFProcess}
                    className="bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-2xl font-black text-xs shadow-xl transition-all flex flex-col items-center justify-center space-y-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <span>PDF WORKBOOK</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={startHTMLProcess}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black text-xs shadow-xl shadow-indigo-900/20 transition-all flex flex-col items-center justify-center space-y-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                    <span>HTML VERSION</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-slate-900 text-slate-100 flex-shrink-0 flex flex-col h-auto md:h-screen md:sticky md:top-0 border-r border-slate-800 z-20">
        <div className="p-6 border-b border-slate-800">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-bold flex items-center"
          >
            <span className="bg-indigo-600 p-2 rounded-lg mr-3 shadow-lg shadow-indigo-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </span>
            Junior Teacher Prep
          </motion.h1>
          <p className="text-slate-400 text-[10px] mt-2 uppercase tracking-[0.2em] font-black">Odisha CBT Specialist</p>
        </div>

        <div className="p-4 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
          {/* Main Action */}
          <div className="grid grid-cols-2 gap-2 no-print">
            <motion.button
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.95 }}
               onClick={() => setShowPdfSettings(true)}
               className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-4 flex flex-col items-center justify-center font-black shadow-xl shadow-indigo-900/30 transition-all border border-indigo-500/50"
            >
               <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
               <span className="text-[9px] uppercase tracking-widest">PDF Export</span>
            </motion.button>
            <motion.button
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.95 }}
               onClick={startHTMLProcess}
               className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl py-4 flex flex-col items-center justify-center font-black shadow-xl transition-all border border-slate-700"
            >
               <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
               <span className="text-[9px] uppercase tracking-widest">HTML VERSION</span>
            </motion.button>
          </div>

          {/* Mode Switcher */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Study Approach</label>
            <div className="flex bg-slate-800 p-1 rounded-xl relative">
              <button 
                onClick={() => toggleViewMode(ViewMode.QUIZ)}
                className={`relative flex-1 py-2 text-xs font-bold rounded-lg transition-all z-10 ${state.viewMode === ViewMode.QUIZ ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Question Bank
                {state.viewMode === ViewMode.QUIZ && (
                  <motion.div layoutId="mode-bg" className="absolute inset-0 bg-indigo-600 rounded-lg -z-10 shadow-lg" />
                )}
              </button>
              <button 
                onClick={() => toggleViewMode(ViewMode.FLASHCARDS)}
                className={`relative flex-1 py-2 text-xs font-bold rounded-lg transition-all z-10 ${state.viewMode === ViewMode.FLASHCARDS ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Flash Cards
                {state.viewMode === ViewMode.FLASHCARDS && (
                  <motion.div layoutId="mode-bg" className="absolute inset-0 bg-indigo-600 rounded-lg -z-10 shadow-lg" />
                )}
              </button>
            </div>
          </div>

          {/* PDF Analysis Tool */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <label className="block text-[10px] font-bold text-indigo-400 uppercase mb-3 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a2a2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z"></path><path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"></path></svg>
              PDF Smart Analysis
            </label>
            {!state.uploadedFile ? (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-indigo-500 hover:bg-slate-800 transition-all group"
              >
                <div className="text-slate-400 group-hover:text-indigo-400 mb-2 flex justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                </div>
                <p className="text-xs text-slate-300 font-medium">Analyze Study PDF</p>
              </button>
            ) : (
              <div className="bg-slate-900 p-3 rounded-lg border border-indigo-500/30 flex items-center justify-between">
                <div className="flex items-center space-x-2 truncate">
                  <div className="bg-indigo-600/20 p-2 rounded text-indigo-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path></svg>
                  </div>
                  <span className="text-xs font-medium text-slate-200 truncate">{state.uploadedFile.name}</span>
                </div>
                <button onClick={clearFile} className="text-slate-500 hover:text-rose-400 p-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="application/pdf" className="hidden" />
          </div>

          {/* Category Toggle */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Category</label>
            <div className="grid grid-cols-1 gap-2">
              {Object.values(Category).map(cat => (
                <motion.button
                  key={cat}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-4 py-2.5 text-sm rounded-lg text-left transition-all font-semibold ${state.category === cat ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  {cat.split(' ')[0]}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Subject Navigation */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Subject Area</label>
            <nav className="space-y-1">
              {SYLLABUS_DATA[state.category].map(section => (
                <motion.button
                  key={section.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSectionChange(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all flex items-center group ${state.selectedSectionId === section.id ? 'bg-indigo-950/30 text-white border-l-4 border-indigo-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <span className={`w-2 h-2 rounded-full mr-3 ${state.selectedSectionId === section.id ? 'bg-indigo-400' : 'bg-slate-700'}`}></span>
                  <span className="truncate">{section.title}</span>
                </motion.button>
              ))}
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-slate-50 min-h-screen">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 px-6 py-4 flex flex-col lg:flex-row justify-between items-center gap-4 no-print">
          <div className="flex flex-col flex-1">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center">
              {state.viewMode === ViewMode.QUIZ ? 'Questions:' : 'Flashcards:'} {currentSection?.title}
            </h2>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{state.category}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startHTMLProcess}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-xs font-black flex items-center space-x-2 shadow-lg hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
              <span>EXPORT HTML</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPdfSettings(true)}
              className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-xs font-black flex items-center space-x-2 shadow-lg hover:bg-emerald-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              <span>EXPORT PDF</span>
            </motion.button>

            <div className="flex items-center bg-slate-100 rounded-full p-1 border border-slate-200 shadow-inner">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setState(prev => ({ ...prev, language: 'en' }))}
                className={`px-6 py-1.5 rounded-full text-xs font-black transition-all ${state.language === 'en' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
              >
                EN
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setState(prev => ({ ...prev, language: 'od' }))}
                className={`px-6 py-1.5 rounded-full text-xs font-black transition-all odia-font ${state.language === 'od' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
              >
                ଓଡ଼ିଆ
              </motion.button>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto p-6 md:p-10 no-print">
          <AnimatePresence mode="wait">
            {state.loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center py-24 space-y-6"
              >
                <div className="w-20 h-20 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-slate-800 font-black text-xl">Curating exam materials...</p>
              </motion.div>
            ) : state.error ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-rose-50 border-2 border-rose-100 rounded-2xl p-10 text-center"
              >
                <p className="text-rose-900 font-extrabold text-xl mb-3">{state.error}</p>
                <button 
                  onClick={() => fetchData(state.selectedSectionId, state.category, state.viewMode)}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold"
                >
                  Try Again
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key={state.viewMode + state.selectedSectionId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                {state.viewMode === ViewMode.QUIZ ? (
                  filteredQuestions.map((q, idx) => (
                    <QuestionCard 
                      key={q.id || idx} 
                      question={q} 
                      lang={state.language} 
                      index={(state.pdfConfig.startRange - 1) + idx} 
                      autoShowSolution={state.studyMode}
                      pdfLanguage={state.pdfConfig.language}
                    />
                  ))
                ) : (
                  <FlashcardSet flashcards={state.flashcards} />
                )}
                
                <div className="pt-10 flex flex-col items-center space-y-4 no-print">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fetchData(state.selectedSectionId, state.category, state.viewMode)}
                    className="bg-slate-900 hover:bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black shadow-xl transition-all flex items-center space-x-3"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    <span>Generate New {state.viewMode}</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default App;
