import React, { useState, useEffect } from 'react';
import { Send, Copy, RefreshCw, Mail, Sparkles, AlertCircle, ChevronRight, Globe, Lightbulb, Key } from 'lucide-react';
import { Tone, Nationality, EmailContext, GenerationResponse } from './types';
import { ToneSelector } from './components/ToneSelector';
import { NationalitySelector } from './components/NationalitySelector';
import { generateEmailResponse } from './services/geminiService';

const App: React.FC = () => {
  // Configuration State
  const [apiKey, setApiKey] = useState(() => {
    // Try to get from env first, then local storage
    return process.env.API_KEY || localStorage.getItem('gemini_api_key') || '';
  });

  // State
  const [emailContent, setEmailContent] = useState('');
  const [tone, setTone] = useState<Tone>(Tone.PROFESSIONAL);
  const [nationality, setNationality] = useState<Nationality>(Nationality.AMERICAN);
  
  // Context State
  const [customerName, setCustomerName] = useState('');
  const [productName, setProductName] = useState('');
  const [affiliateLink, setAffiliateLink] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');

  // UI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [response, setResponse] = useState<GenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Update localStorage when apiKey changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('gemini_api_key', apiKey);
    }
  }, [apiKey]);

  const handleGenerate = async () => {
    if (!apiKey) {
      setError("API Key is missing. Please enter it in the configuration section below.");
      return;
    }

    const hasEmail = emailContent.trim().length > 0;
    const hasInstructions = customInstructions.trim().length > 0;

    if (!hasEmail && !hasInstructions) {
      setError("Please provide either the Customer Email Content (to reply) or a Specific Idea/Prompt (to create a new email).");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setResponse(null);

    const context: EmailContext = {
      customerName,
      productName,
      affiliateLink,
      keyPoints,
      customInstructions
    };

    try {
      const result = await generateEmailResponse({
        emailContent,
        tone,
        nationality,
        context
      }, apiKey); // Pass apiKey explicitly
      setResponse(result);
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : "Failed to generate response";
      setError(`Error: ${errorMessage}.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (response) {
      const fullText = `Subject: ${response.subject}\n\n${response.body.replace(/<br\/>/g, '\n')}`;
      navigator.clipboard.writeText(fullText);
      alert("Email copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Sidebar / Left Panel - Inputs */}
      <div className="w-full md:w-5/12 lg:w-4/12 bg-white border-r border-slate-200 h-auto md:h-screen overflow-y-auto p-6 flex flex-col">
        <div className="mb-8 flex items-center space-x-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Mail className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">AffiliateResponse</h1>
            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Workspace</p>
          </div>
        </div>

        <div className="space-y-6 flex-grow">
          
          {/* Nationality Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
              <Globe size={14} className="mr-1.5 text-slate-400" />
              Speaker Nationality
            </label>
            <NationalitySelector selected={nationality} onSelect={setNationality} />
          </div>

          {/* Incoming Email (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Customer Email Content <span className="text-slate-400 font-normal ml-1">(Optional if creating new)</span>
            </label>
            <textarea
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              placeholder="Paste customer email to reply..."
              className="w-full h-24 p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm text-slate-700 placeholder-slate-400 bg-slate-50 transition-all"
            />
          </div>

           {/* Custom Prompt / Idea Box */}
           <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
              <Lightbulb size={14} className="mr-1.5 text-slate-400" />
              Specific Idea or Prompt <span className="text-slate-400 font-normal ml-1">(Required for new)</span>
            </label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. Write a follow-up email about the summer sale ending in 24 hours..."
              className="w-full h-24 p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none text-sm text-slate-700 placeholder-slate-400 bg-amber-50/50 transition-all"
            />
          </div>

          {/* Context Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center">
              <Sparkles size={14} className="mr-2 text-blue-600" />
              Context & Details
            </h3>
            <div className="space-y-3">
               <input
                type="text"
                placeholder="Customer Name (Optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-2 rounded border border-slate-200 text-sm focus:outline-none focus:border-blue-400"
              />
              <input
                type="text"
                placeholder="Product / Service Name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full p-2 rounded border border-slate-200 text-sm focus:outline-none focus:border-blue-400"
              />
              <input
                type="text"
                placeholder="Affiliate Link (Optional)"
                value={affiliateLink}
                onChange={(e) => setAffiliateLink(e.target.value)}
                className="w-full p-2 rounded border border-slate-200 text-sm focus:outline-none focus:border-blue-400"
              />
              <textarea
                placeholder="Key points list (optional)..."
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
                className="w-full p-2 rounded border border-slate-200 text-sm focus:outline-none focus:border-blue-400 h-16 resize-none"
              />
            </div>
          </div>

          {/* Tone Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Response Tone
            </label>
            <ToneSelector selectedTone={tone} onSelect={setTone} />
          </div>

          {/* API Key Configuration - Restored */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center">
              <Key size={12} className="mr-1.5" />
              API Configuration
            </label>
            <input
              type="password"
              placeholder="Paste Gemini API Key (starts with AIza...)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className={`w-full p-2 rounded border text-xs focus:outline-none focus:border-blue-400 transition-colors ${
                !apiKey && error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
              }`}
            />
          </div>

        </div>

        {/* Action Area */}
        <div className="pt-6 mt-6 border-t border-slate-100">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center">
              <AlertCircle size={16} className="mr-2" />
              {error}
            </div>
          )}
          
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full py-3 px-4 rounded-lg flex items-center justify-center font-medium text-white transition-all shadow-lg ${
              isGenerating 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="animate-spin mr-2" size={20} />
                Drafting...
              </>
            ) : (
              <>
                <Send className="mr-2" size={20} />
                Generate Email
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content / Right Panel - Output */}
      <div className="w-full md:w-7/12 lg:w-8/12 bg-slate-50 p-4 md:p-8 md:h-screen overflow-y-auto">
        
        <div className="max-w-3xl mx-auto h-full flex flex-col">
          {!response ? (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-100/50 min-h-[400px]">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <Mail size={32} className="text-slate-300" />
              </div>
              <p className="text-lg font-medium">Ready to draft your email</p>
              <p className="text-sm mt-2 max-w-xs text-center text-slate-400">
                Paste a customer email to reply, OR use the "Specific Idea" box to start a new conversation.
              </p>
            </div>
          ) : (
            <div className="flex-grow flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Draft Response</h2>
                <div className="flex space-x-2">
                  <button 
                    onClick={handleGenerate}
                    className="flex items-center px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Regenerate
                  </button>
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center px-3 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors shadow-sm"
                  >
                    <Copy size={16} className="mr-2" />
                    Copy Text
                  </button>
                </div>
              </div>

              {/* Email Preview Card */}
              <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                {/* Email Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                  <div className="grid grid-cols-[80px_1fr] gap-2 items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">To</span>
                    <span className="text-sm font-medium text-slate-700">{customerName || "Customer"}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-2 items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Subject</span>
                    <span className="text-sm font-semibold text-slate-900">{response.subject}</span>
                  </div>
                </div>

                {/* Email Body */}
                <div className="p-8 text-slate-700 leading-relaxed text-base font-normal whitespace-pre-wrap">
                   <div dangerouslySetInnerHTML={{ __html: response.body }} />
                </div>

                {/* Email Footer Preview */}
                <div className="px-8 pb-8 pt-4">
                  <div className="border-t border-slate-100 pt-4 flex items-center text-slate-400 text-sm">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3 font-bold">
                       A
                    </div>
                    <div>
                      <p className="font-medium text-slate-600">Alex</p>
                      <p className="text-xs">Customer Success | Affiliate Team</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback / Tips */}
              <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start">
                 <div className="bg-blue-100 p-1 rounded-full mr-3 mt-0.5">
                   <ChevronRight size={14} className="text-blue-600" />
                 </div>
                 <div>
                   <h4 className="text-sm font-semibold text-blue-800">Pro Tip</h4>
                   <p className="text-sm text-blue-700 mt-1">
                     Review the affiliate link placement. Ensure it flows naturally within the paragraph to increase click-through rates without sounding too pushy.
                   </p>
                 </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;