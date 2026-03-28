import { GoogleGenAI, Type } from "@google/genai";

export const config = {
  runtime: 'edge', // This makes the function load much faster on Vercel (zero cold starts)
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json();
    const { subjectTitle, topics, categoryName, fileData, type } = body;
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API_KEY_MISSING" }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    if (type === 'flashcards') {
      const textPart = {
        text: `
        Act as a senior teacher educator for the Odisha Junior Teacher recruitment. 
        Generate 10 high-yield flashcards for quick revision of key terms, pedagogical concepts, and important facts.
        
        Subject: "${subjectTitle}"
        Category: "${categoryName}"
        Topics: ${topics.join(", ")}
        
        ${fileData ? "CRITICAL: Use the provided PDF to extract specific technical terms, dates, theories, and definitions mentioned in the document." : "Use standard academic syllabus content for Junior Teacher exams."}

        Requirements:
        1. Each flashcard must have a Term (Front) and a Definition/Explanation (Back).
        2. Everything must be BILINGUAL (English and Odia).
        3. Focus on "must-know" facts, acronyms (like NCF, RTE, CCE), and key pedagogical definitions.
        4. Odia must be formal and academically precise.
        
        Return the data as a JSON array of objects.
      `};

      const parts: any[] = [textPart];
      if (fileData) {
        parts.push({
          inlineData: { data: fileData.data, mimeType: fileData.mimeType }
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                termEn: { type: Type.STRING },
                termOd: { type: Type.STRING },
                definitionEn: { type: Type.STRING },
                definitionOd: { type: Type.STRING },
                conceptCategory: { type: Type.STRING }
              },
              required: ["id", "termEn", "termOd", "definitionEn", "definitionOd"]
            }
          }
        }
      });

      return new Response(response.text || "[]", {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
        }
      });
    } else {
      // Default to questions
      const textPart = {
        text: `
        Act as an expert examiner for the Odisha Junior Teacher (Schematic) exam. 
        Your goal is to help students crack the exam by providing high-quality bilingual practice material.
        
        Generate EXACTLY 10 expert-level Multiple Choice Questions (MCQs) for the subject "${subjectTitle}" under "${categoryName}".
        Specific topics to cover: ${topics.join(", ")}.
        
        ${fileData ? "CRITICAL: A reference study document has been uploaded. Analyze its content thoroughly and extract key concepts, facts, and pedagogical theories to generate exactly 10 highly relevant questions aligned with this source material." : "Analyze the standard JT exam syllabus and pedagogical standards for this subject to generate 10 comprehensive questions."}

        CRITICAL REQUIREMENTS:
        1. EACH question MUST be strictly bilingual: provide a full English version AND a faithful, accurate Odia translation.
        2. Follow the CBT exam pattern: 4 clear options (A, B, C, D) per question, with exactly ONE correct answer.
        3. Options must also be provided in BOTH English and Odia.
        4. Provide a detailed, conceptual explanation for the answer in both English and Odia.
        5. Language Quality: 
           - English: Professional, clear, and grammatically correct.
           - Odia: Use formal academic Odia as found in SCERT/Odisha State Board textbooks. Ensure correct spelling and punctuation.
        6. Ensure the difficulty level matches the Junior Teacher recruitment standards.
        7. Return exactly 10 questions in the array.
      `};

      const parts: any[] = [textPart];
      if (fileData) {
        parts.push({
          inlineData: {
            data: fileData.data,
            mimeType: fileData.mimeType,
          }
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                subject: { type: Type.STRING },
                questionEn: { type: Type.STRING },
                questionOd: { type: Type.STRING },
                optionsEn: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  minItems: 4,
                  maxItems: 4
                },
                optionsOd: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  minItems: 4,
                  maxItems: 4
                },
                correctOptionIndex: { type: Type.INTEGER },
                explanationEn: { type: Type.STRING },
                explanationOd: { type: Type.STRING }
              },
              required: [
                "id", "questionEn", "questionOd", "optionsEn", "optionsOd", 
                "correctOptionIndex", "explanationEn", "explanationOd"
              ]
            }
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");
      
      const questions = JSON.parse(text).map((q: any) => ({ ...q, subject: subjectTitle }));
      
      return new Response(JSON.stringify(questions), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
        }
      });
    }
  } catch (error: any) {
    console.error("Edge Function Error:", error);
    
    let errorMessage = "Internal Server Error";
    let statusCode = 500;
    
    if (error.status === 429 || error.message?.includes("429") || error.message?.includes("Quota exceeded")) {
      errorMessage = "RATE_LIMIT_EXCEEDED";
      statusCode = 429;
    } else if (error.message?.includes("API key not valid") || error.status === 400 || error.status === 401 || error.status === 403) {
      errorMessage = "API_KEY_INVALID";
      statusCode = 401;
    }

    return new Response(JSON.stringify({ error: errorMessage, details: error.message }), { 
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
