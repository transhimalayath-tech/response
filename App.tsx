import React, { useState, useEffect } from 'react';
import { Send, Copy, RefreshCw, Mail, Sparkles, AlertCircle, ChevronRight, Globe, Lightbulb, Key, Clock, MapPin, User, Users, BadgeCheck, Shield } from 'lucide-react';
import { Tone, Nationality, EmailContext, GenerationResponse } from './types';
import { ToneSelector } from './components/ToneSelector';
import { NationalitySelector } from './components/NationalitySelector';
import { generateEmailResponse } from './services/geminiService';
import { TimeTools } from './components/TimeTools';

const COMMON_TIMEZONES = [
  { region: 'United States', label: 'Pacific Time (LA, SF)', value: 'America/Los_Angeles' },
  { region: 'United States', label: 'Mountain Time (Denver)', value: 'America/Denver' },
  { region: 'United States', label: 'Central Time (Chicago)', value: 'America/Chicago' },
  { region: 'United States', label: 'Eastern Time (NY, DC)', value: 'America/New_York' },
  { region: 'Europe', label: 'UK (London)', value: 'Europe/London' },
  { region: 'Europe', label: 'Central Europe (Paris, Berlin)', value: 'Europe/Paris' },
  { region: 'Europe', label: 'Eastern Europe (Athens)', value: 'Europe/Athens' },
  { region: 'Asia', label: 'Dubai (GST)', value: 'Asia/Dubai' },
  { region: 'Asia', label: 'India (IST)', value: 'Asia/Kolkata' },
  { region: 'Asia', label: 'Singapore / China', value: 'Asia/Singapore' },
  { region: 'Asia', label: 'Japan (Tokyo)', value: 'Asia/Tokyo' },
  { region: 'Australia', label: 'Sydney / Melbourne', value: 'Australia/Sydney' },
];

const App: React.FC = () => {
  // Configuration State
  const [apiKey, setApiKey] = useState(() => {
    // Try to get from env first, then local storage
    return process.env.API_KEY || localStorage.getItem('gemini_api_key') || '';
  });

  // Sidebar Tab State
  const [activeTab, setActiveTab] = useState<'compose' | 'time' | 'identity'>('compose');

  // Location & Time State
  const [userTimezone, setUserTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
      return 'America/New_York';
    }
  });
  const [clientTimezone, setClientTimezone] = useState('Europe/London');
  const [now, setNow] = useState(new Date());

  // Context UI State
  const [contextTab, setContextTab] = useState<'details' | 'location'>('details');

  // Core App State
  const [emailContent, setEmailContent] = useState('');
  const [tone, setTone] = useState<Tone>(Tone.PROFESSIONAL);
  const [nationality, setNationality] = useState<Nationality>(Nationality.AMERICAN);
  const [senderAlias, setSenderAlias] = useState('Alex'); // Default Alias
  
  // Context Data State
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

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
      customInstructions,
      senderAlias
    };

    try {
      const result = await generateEmailResponse({
        emailContent,
        tone,
        nationality,
        context
      }, apiKey); 
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

  const formatTimeSimple = (date: Date, timeZone: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        timeZone,
      }).format(date);
    } catch (e) {
      return '--:--';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Sidebar / Left Panel - Inputs */}
      <div className="w-full md:w-5/12 lg:w-4/12 bg-white border-r border-slate-200 h-auto md:h-screen overflow-y-auto p-6 flex flex-col">
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-6">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Mail className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">AffiliateResponse</h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Workspace</p>
            </div>
          </div>

          {/* Sidebar Tab Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('compose')} 
              className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'compose' 
                  ? 'bg-white shadow-sm text-blue-700' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <Mail size={16} className="mr-2" />
              Compose
            </button>
            <button 
              onClick={() => setActiveTab('time')} 
              className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'time' 
                  ? 'bg-white shadow-sm text-blue-700' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <Clock size={16} className="mr-2" />
              Time
            </button>
            <button 
              onClick={() => setActiveTab('identity')} 
              className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'identity' 
                  ? 'bg-white shadow-sm text-blue-700' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <User size={16} className="mr-2" />
              Identity
            </button>
          </div>
        </div>

        {activeTab === 'time' ? (
          <div className="flex-grow">
            <TimeTools 
              userTimezone={userTimezone} 
              clientTimezone={clientTimezone}
              setUserTimezone={setUserTimezone}
              setClientTimezone={setClientTimezone}
              availableTimezones={COMMON_TIMEZONES}
            />
          </div>
        ) : activeTab === 'identity' ? (
          <div className="flex-grow animate-in fade-in duration-300 space-y-6">
             <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 relative overflow-hidden">
                <div className="relative z-10">
                   <h3 className="text-blue-900 font-bold flex items-center text-lg mb-2">
                      <BadgeCheck size={20} className="mr-2 text-blue-600" />
                      Sender Identity
                   </h3>
                   <p className="text-sm text-blue-700 mb-4">
                      Configure the persona used for your correspondence. Using a consistent Western alias is standard practice in affiliate marketing to build familiarity.
                   </p>
                </div>
                <div className="absolute -right-4 -bottom-4 text-blue-100/80">
                   <Shield size={100} />
                </div>
             </div>

             <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Alias Name
                  </label>
                  <input
                    type="text"
                    value={senderAlias}
                    onChange={(e) => setSenderAlias(e.target.value)}
                    placeholder="e.g. Alex, Sarah, Michael"
                    className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700 bg-white"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                     This name will appear in your email signature and will be used by the AI to introduce itself.
                  </p>
                </div>

                <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Preview Signature</h4>
                    <div className="flex items-center text-slate-600 text-sm bg-white p-3 rounded border border-slate-100">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 mr-3 font-bold text-lg">
                           {senderAlias.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{senderAlias}</p>
                          <p className="text-xs text-slate-500">Customer Success | Affiliate Team</p>
                        </div>
                    </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="space-y-6 flex-grow animate-in fade-in duration-300">
            
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

            {/* Context Details with Tabs */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden transition-all duration-300">
              <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-slate-200 bg-slate-100/50">
                 <h3 className="text-sm font-semibold text-slate-800 flex items-center">
                  <Sparkles size={14} className="mr-2 text-blue-600" />
                  Context & Details
                </h3>
                <div className="flex bg-slate-200 p-0.5 rounded text-xs">
                  <button 
                    onClick={() => setContextTab('details')}
                    className={`px-3 py-1 rounded-sm transition-all ${contextTab === 'details' ? 'bg-white text-blue-700 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Details
                  </button>
                   <button 
                    onClick={() => setContextTab('location')}
                    className={`px-3 py-1 rounded-sm transition-all ${contextTab === 'location' ? 'bg-white text-blue-700 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Location
                  </button>
                </div>
              </div>
              
              <div className="p-4 space-y-3 bg-white">
                {contextTab === 'details' ? (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <input
                      type="text"
                      placeholder="Customer Name (Optional)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full p-2 rounded border border-slate-200 text-sm focus:outline-none focus:border-blue-400 transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="Product / Service Name"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full p-2 rounded border border-slate-200 text-sm focus:outline-none focus:border-blue-400 transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="Affiliate Link (Optional)"
                      value={affiliateLink}
                      onChange={(e) => setAffiliateLink(e.target.value)}
                      className="w-full p-2 rounded border border-slate-200 text-sm focus:outline-none focus:border-blue-400 transition-colors"
                    />
                    <textarea
                      placeholder="Key points list (optional)..."
                      value={keyPoints}
                      onChange={(e) => setKeyPoints(e.target.value)}
                      className="w-full p-2 rounded border border-slate-200 text-sm focus:outline-none focus:border-blue-400 h-16 resize-none transition-colors"
                    />
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* User Location Input */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-slate-500 flex items-center">
                          <User size={12} className="mr-1" /> Your Location
                        </label>
                        <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {formatTimeSimple(now, userTimezone)}
                        </span>
                      </div>
                      <select 
                        value={userTimezone}
                        onChange={(e) => setUserTimezone(e.target.value)}
                        className="w-full text-sm p-2 bg-white rounded border border-slate-300 text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                      >
                         {COMMON_TIMEZONES.map(tz => (
                            <option key={tz.value} value={tz.value}>{tz.label}</option>
                         ))}
                      </select>
                    </div>

                    {/* Client Location Input */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-slate-500 flex items-center">
                          <Users size={12} className="mr-1" /> Client Location
                        </label>
                        <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                          {formatTimeSimple(now, clientTimezone)}
                        </span>
                      </div>
                      <select 
                        value={clientTimezone}
                        onChange={(e) => setClientTimezone(e.target.value)}
                        className="w-full text-sm p-2 bg-white rounded border border-slate-300 text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                      >
                         {COMMON_TIMEZONES.map(tz => (
                            <option key={tz.value} value={tz.value}>{tz.label}</option>
                         ))}
                      </select>
                    </div>
                  </div>
                )}
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
        )}

        {/* Action Area (Only visible in Compose tab) */}
        {activeTab === 'compose' && (
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
        )}
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
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3 font-bold uppercase">
                       {senderAlias.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-600">{senderAlias}</p>
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