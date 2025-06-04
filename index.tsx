
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';

// Configure the PDF.js worker
const PDF_JS_WORKER_SRC = 'https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.mjs';
try {
    if (typeof window !== 'undefined') { // Ensure this runs only in the browser
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_JS_WORKER_SRC;
    }
} catch (error) {
    console.error("Error setting PDF.js worker source:", error);
}


const App: React.FC = () => {
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [summary, setSummary] = useState<string | null>(null);
    const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isTTSAvailable, setIsTTSAvailable] = useState<boolean>(true);
    const [selectedLanguage, setSelectedLanguage] = useState<string>('en'); // 'en' or 'pt-BR'

    const aiRef = useRef<GoogleGenAI | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        try {
            if (!process.env.API_KEY) {
                setError("API key is not configured. Please set the API_KEY environment variable.");
                console.error("API_KEY environment variable is not set.");
                return;
            }
            aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
        } catch (e: any) {
            console.error("Failed to initialize GoogleGenAI:", e);
            setError(`Failed to initialize AI SDK: ${e.message}`);
        }

        if (!('speechSynthesis' in window) || !window.speechSynthesis) {
            setIsTTSAvailable(false);
            console.warn("Speech synthesis not available in this browser.");
        }
    }, []);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type === "application/pdf") {
                setIsLoadingFile(true);
                setError(null);
                setSummary(null);
                setFileContent(null);
                setFileName(file.name);
                
                if (isTTSAvailable && speechSynthesis.speaking) {
                    speechSynthesis.cancel();
                    setIsSpeaking(false);
                    utteranceRef.current = null;
                }
                
                try {
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        try {
                            const arrayBuffer = e.target?.result as ArrayBuffer;
                            if (!arrayBuffer) {
                                throw new Error("File reading resulted in empty buffer.");
                            }
                            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                            let textContent = "";
                            for (let i = 1; i <= pdf.numPages; i++) {
                                const page = await pdf.getPage(i);
                                const text = await page.getTextContent();
                                textContent += text.items.map((item: any) => (item.str || "")).join(" ") + "\n";
                            }
                            setFileContent(textContent);
                        } catch (pdfError: any) {
                             console.error("Failed to parse PDF:", pdfError);
                             setError(`Failed to parse PDF: ${pdfError.message}. Ensure it's a valid PDF file.`);
                             setFileContent(null);
                             setFileName(null);
                        } finally {
                            setIsLoadingFile(false);
                        }
                    };
                    reader.onerror = () => {
                        setError("Failed to read the PDF file.");
                        setIsLoadingFile(false);
                        setFileName(null);
                        setFileContent(null);
                    };
                    reader.readAsArrayBuffer(file);

                } catch (err: any) {
                    console.error("Error initiating PDF processing:", err);
                    setError(`Error processing PDF: ${err.message}`);
                    setIsLoadingFile(false);
                    setFileName(null);
                    setFileContent(null);
                }

            } else {
                setError("Please upload a PDF file (.pdf).");
                setFileName(null);
                setFileContent(null);
                event.target.value = ''; 
            }
        }
    };

    const handleAnalyze = async () => {
        if (!fileContent) {
            setError("No file content to analyze. Please upload and process a PDF.");
            return;
        }
        if (!aiRef.current) {
            setError("AI SDK not initialized. Check API key configuration.");
            return;
        }
        setIsAnalyzing(true);
        setError(null);
        setSummary(null);

        if (isTTSAvailable && speechSynthesis.speaking) {
            speechSynthesis.cancel();
            setIsSpeaking(false);
            utteranceRef.current = null;
        }

        let languageInstruction = "Provide the summary in English.";
        if (selectedLanguage === 'pt-BR') {
            languageInstruction = "Forneça o resumo em Português do Brasil.";
        }

        try {
            const response: GenerateContentResponse = await aiRef.current.models.generateContent({
                model: 'gemini-2.5-flash-preview-04-17',
                contents: `${languageInstruction}\n\nPlease summarize the following document (extracted from a PDF) and provide key insights:\n\n${fileContent}`,
                config: {
                  temperature: 0.5,
                }
            });
            setSummary(response.text);
        } catch (e: any) {
            console.error("Error during AI analysis:", e);
            setError(`AI analysis failed: ${e.message}`);
            setSummary(null);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handlePlayAudio = () => {
        if (!summary || !isTTSAvailable) return;

        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(summary);
        utteranceRef.current = utterance;

        utterance.lang = selectedLanguage === 'en' ? 'en-US' : 'pt-BR';

        utterance.onstart = () => setIsSpeaking(true);
        
        utterance.onend = () => {
            setIsSpeaking(false);
            utteranceRef.current = null;
        };

        utterance.onerror = (event) => {
            const errorReason = event.error || "Unknown speech error";
            if (errorReason === 'interrupted' || errorReason === 'canceled') {
                console.log(`Speech synthesis event (reason: ${errorReason}): Speech was normally canceled or interrupted.`, event);
            } else {
                console.error("Speech synthesis error event:", event);
                console.error(`Speech synthesis error reason: ${errorReason}`);
                setError(`Audio playback error: ${errorReason}`);
            }
            setIsSpeaking(false);
            utteranceRef.current = null;
        };
        speechSynthesis.speak(utterance);
    };

    const handleStopAudio = () => {
        if (!isTTSAvailable) return;
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        setIsSpeaking(false);
        utteranceRef.current = null;
    };

    const handleLanguageChange = (lang: string) => {
        setSelectedLanguage(lang);
        // Optionally, clear summary if language changes and user expects re-analysis
        // setSummary(null); 
    };

    return (
        <div className="container">
            <h1>AI PDF Analyzer & Explainer</h1>

            {error && <div className="error-message" role="alert">{error}</div>}

            <div className="file-input-container">
                 <label htmlFor="file-upload" className={`custom-file-upload ${isLoadingFile || isAnalyzing ? 'disabled' : ''}`}
                    aria-disabled={isLoadingFile || isAnalyzing}>
                    Choose .pdf File
                </label>
                <input
                    id="file-upload"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    aria-label="Upload PDF paper for analysis"
                    disabled={isLoadingFile || isAnalyzing}
                />
                {fileName && <p className="file-name">Selected: {fileName}</p>}
                {isLoadingFile && <div className="status-message loader" aria-live="polite">Processing PDF...</div>}
            </div>

            <div className="language-switch-container">
                <span id="language-switch-label" className="language-switch-label-text">Output Language:</span>
                <div role="radiogroup" aria-labelledby="language-switch-label">
                    <label className={`language-option ${selectedLanguage === 'en' ? 'active' : ''}`}>
                        <input
                            type="radio"
                            name="language"
                            value="en"
                            checked={selectedLanguage === 'en'}
                            onChange={() => handleLanguageChange('en')}
                            disabled={isLoadingFile || isAnalyzing}
                            aria-label="Select English language output"
                        />
                        <span>English</span>
                    </label>
                    <label className={`language-option ${selectedLanguage === 'pt-BR' ? 'active' : ''}`}>
                        <input
                            type="radio"
                            name="language"
                            value="pt-BR"
                            checked={selectedLanguage === 'pt-BR'}
                            onChange={() => handleLanguageChange('pt-BR')}
                            disabled={isLoadingFile || isAnalyzing}
                            aria-label="Select Brazilian Portuguese language output"
                        />
                        <span>Português (Brasil)</span>
                    </label>
                </div>
            </div>

            <button
                onClick={handleAnalyze}
                disabled={!fileContent || isAnalyzing || isLoadingFile || !aiRef.current}
                aria-label="Analyze and summarize uploaded PDF paper"
            >
                {isAnalyzing ? <span className="loader">Analyzing...</span> : "Analyze & Summarize"}
            </button>

            {summary && (
                <section className="summary-section" aria-labelledby="summary-heading">
                    <h2 id="summary-heading">Summary</h2>
                    <div className="summary-text" tabIndex={0}>{summary}</div>
                </section>
            )}
            
            {!summary && fileContent && !isAnalyzing && (
                 <div className="summary-section">
                    <h2 id="summary-heading-placeholder">Summary</h2>
                    <p className="placeholder summary-text">Click "Analyze & Summarize" to generate the summary from the processed PDF.</p>
                 </div>
            )}
             {!summary && !fileContent && !isLoadingFile && !isAnalyzing && (
                 <div className="summary-section">
                    <h2 id="summary-heading-placeholder">Summary</h2>
                    <p className="placeholder summary-text">Upload a PDF to begin.</p>
                 </div>
            )}


            {isTTSAvailable && summary && (
                <section className="audio-section" aria-labelledby="audio-heading">
                    <h2 id="audio-heading">Audio Explanation</h2>
                    <button 
                        onClick={isSpeaking ? handleStopAudio : handlePlayAudio} 
                        disabled={isAnalyzing || isLoadingFile}
                        aria-live="polite"
                        aria-label={isSpeaking ? "Stop audio explanation" : "Play audio explanation of the summary"}
                    >
                        {isSpeaking ? "Stop Explanation" : "Play Explanation"}
                    </button>
                </section>
            )}
             {!isTTSAvailable && summary && <p className="status-message tts-unavailable-message">Text-to-speech is not available on this browser. You can still read the summary.</p>}
        </div>
    );
};

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<React.StrictMode><App /></React.StrictMode>);
} else {
    console.error("Fatal Error: Root element with ID 'root' not found in the DOM.");
    const errorDiv = document.createElement('div');
    errorDiv.textContent = "Application initialization failed: Root element not found.";
    errorDiv.style.color = "red";
    errorDiv.style.padding = "20px";
    errorDiv.style.textAlign = "center";
    document.body.innerHTML = ''; 
    document.body.appendChild(errorDiv);
}
