import React, { useState, useEffect, useCallback } from 'react';
import { Globe, MapPin, Calendar, Clock, ChevronDown, ArrowLeftRight, ArrowRight } from 'lucide-react';

interface TimeToolsProps {
  userTimezone: string;
  clientTimezone: string;
  setUserTimezone: (tz: string) => void;
  setClientTimezone: (tz: string) => void;
  availableTimezones: Array<{ label: string; value: string }>;
}

export const TimeTools: React.FC<TimeToolsProps> = ({ 
  userTimezone, 
  clientTimezone, 
  setUserTimezone, 
  setClientTimezone,
  availableTimezones 
}) => {
  const [now, setNow] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'planner' | 'regional'>('planner');
  const [regionalView, setRegionalView] = useState<'IST' | 'NY'>('IST');
  
  // Bi-directional Meeting Planner State
  // Store ISO strings suitable for datetime-local input: "YYYY-MM-DDTHH:mm"
  const [userMeetingTime, setUserMeetingTime] = useState('');
  const [clientMeetingTime, setClientMeetingTime] = useState('');
  const [lastEdited, setLastEdited] = useState<'user' | 'client'>('user');

  // Helper: Parse "YYYY-MM-DDTHH:mm" to components
  const parseIsoLocal = (s: string) => {
    if (!s) return null;
    const [date, time] = s.split('T');
    if (!date || !time) return null;
    const [y, mon, d] = date.split('-').map(Number);
    const [h, min] = time.split(':').map(Number);
    return { y, mon: mon - 1, d, h, min };
  };

  // Helper: Convert Local Wall Clock String -> Absolute Date Object
  const localStringToDate = useCallback((s: string, zone: string): Date | null => {
     const c = parseIsoLocal(s);
     if (!c) return null;
     
     // Start with a guess treating inputs as UTC
     let guess = new Date(Date.UTC(c.y, c.mon, c.d, c.h, c.min));
     
     // Converge to actual time in zone
     for(let i=0; i<3; i++) {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: zone,
          year: 'numeric', month: 'numeric', day: 'numeric',
          hour: 'numeric', minute: 'numeric', second: 'numeric',
          hour12: false
        }).formatToParts(guess);
        
        const partVal = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);
        
        const gy = partVal('year');
        const gm = partVal('month') - 1;
        const gd = partVal('day');
        let gh = partVal('hour'); 
        if (gh === 24) gh = 0;
        const gmin = partVal('minute');

        const guessTime = Date.UTC(gy, gm, gd, gh, gmin);
        const desiredTime = Date.UTC(c.y, c.mon, c.d, c.h, c.min);
        
        const diff = desiredTime - guessTime;
        if (Math.abs(diff) < 1000) break; // Close enough
        
        guess = new Date(guess.getTime() + diff);
     }
     return guess;
  }, []);

  // Helper: Convert Absolute Date Object -> Local Wall Clock String
  const dateToLocalString = useCallback((d: Date, zone: string): string => {
     try {
       const parts = new Intl.DateTimeFormat('en-GB', {
          timeZone: zone,
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', hour12: false
       }).formatToParts(d);
       
       const get = (t: string) => parts.find(p => p.type === t)?.value || '00';
       return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
     } catch (e) {
       return '';
     }
  }, []);

  // Initial setup: Set "User Meeting Time" to next hour
  useEffect(() => {
    const initDate = new Date();
    initDate.setMinutes(0);
    initDate.setHours(initDate.getHours() + 1);
    const initStr = dateToLocalString(initDate, userTimezone);
    setUserMeetingTime(initStr);
    
    // Calculate initial client time
    const absDate = localStringToDate(initStr, userTimezone);
    if (absDate) {
      setClientMeetingTime(dateToLocalString(absDate, clientTimezone));
    }
  }, []); 

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);


  // Handle Input Changes
  const handleUserTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserMeetingTime(val);
    setLastEdited('user');
    
    if (val) {
        const absDate = localStringToDate(val, userTimezone);
        if (absDate) {
            setClientMeetingTime(dateToLocalString(absDate, clientTimezone));
        }
    } else {
        setClientMeetingTime('');
    }
  };

  const handleClientTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setClientMeetingTime(val);
    setLastEdited('client');
    
    if (val) {
        const absDate = localStringToDate(val, clientTimezone);
        if (absDate) {
            setUserMeetingTime(dateToLocalString(absDate, userTimezone));
        }
    } else {
        setUserMeetingTime('');
    }
  };

  // React to Timezone Changes
  useEffect(() => {
    if (lastEdited === 'user' && userMeetingTime) {
        // User didn't change time, just timezone context, or client timezone changed.
        // Recalculate Client Time based on User Time
        const absDate = localStringToDate(userMeetingTime, userTimezone);
        if (absDate) {
            setClientMeetingTime(dateToLocalString(absDate, clientTimezone));
        }
    } else if (lastEdited === 'client' && clientMeetingTime) {
        // Client time is the anchor
        const absDate = localStringToDate(clientMeetingTime, clientTimezone);
        if (absDate) {
            setUserMeetingTime(dateToLocalString(absDate, userTimezone));
        }
    }
  }, [userTimezone, clientTimezone, lastEdited, userMeetingTime, clientMeetingTime, localStringToDate, dateToLocalString]);


  const formatTime = (date: Date, timeZone?: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true,
        timeZone,
      }).format(date);
    } catch (e) {
      return '--:--:--';
    }
  };
  
  const formatDate = (date: Date, timeZone?: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone,
      }).format(date);
    } catch (e) {
      return '';
    }
  };

  const getAbbreviation = (date: Date, timeZone: string) => {
    try {
        const formatter = (options: Intl.DateTimeFormatOptions) => 
            new Intl.DateTimeFormat('en-US', { ...options, timeZone }).formatToParts(date)
            .find(p => p.type === 'timeZoneName')?.value || '';

        let shortName = formatter({ timeZoneName: 'short' });
        // Try shortOffset (GMT-5), fallback to longOffset if needed (GMT-05:00)
        const offset = formatter({ timeZoneName: 'shortOffset' }) || formatter({ timeZoneName: 'longOffset' });
        
        // Helper to check if a string looks like a GMT/UTC offset
        const isOffsetLike = (s: string) => /^GMT[+-]/.test(s) || /^UTC[+-]/.test(s);
        
        let abbreviation = shortName;

        // If the short name is just "GMT+5:30", try to get a better abbreviation like "IST"
        if (isOffsetLike(shortName)) {
            const longName = formatter({ timeZoneName: 'long' });
            if (longName) {
                // Heuristic: Extract capital letters from the long name
                // e.g. "India Standard Time" -> "IST"
                // e.g. "China Standard Time" -> "CST"
                const acronym = longName.match(/\b([A-Z])/g)?.join('');
                if (acronym && acronym.length >= 2 && acronym.length <= 5) {
                     abbreviation = acronym;
                }
            }
        }
        
        // If we failed to get a nice abbreviation and it's still just the offset, return the offset.
        if (isOffsetLike(abbreviation)) {
             return abbreviation; 
        }

        // Return formatted string: "IST (GMT+5:30)"
        // If the abbreviation and offset are redundant (unlikely given logic above, but safety check), handle it.
        if (abbreviation === offset) return abbreviation;
        
        return `${abbreviation} (${offset})`;
    } catch { return ''; }
  };

  // Derived properties for Reference View
  const refTimezone = regionalView === 'IST' ? 'Asia/Kolkata' : 'America/New_York';
  const refLabel = regionalView === 'IST' ? 'India Standard Time' : 'New York Time';
  const refShort = regionalView === 'IST' ? 'IST' : 'ET';
  
  // Theme classes helper
  const getThemeClasses = (type: 'bg' | 'text' | 'border' | 'light-bg') => {
    const isIst = regionalView === 'IST';
    switch (type) {
        case 'bg': return isIst ? 'bg-orange-50' : 'bg-indigo-50';
        case 'text': return isIst ? 'text-orange-700' : 'text-indigo-700';
        case 'border': return isIst ? 'border-orange-100' : 'border-indigo-100';
        case 'light-bg': return isIst ? 'bg-orange-100' : 'bg-indigo-100';
        default: return '';
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-4">
           <div className="flex items-center space-x-2 text-slate-800 font-semibold text-lg">
               <Globe size={20} className="text-blue-600" />
               <h2>World Clock</h2>
           </div>
           
           <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('planner')} 
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'planner' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Planner
              </button>
              <button 
                onClick={() => setActiveTab('regional')} 
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'regional' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Quick Refs
              </button>
           </div>
        </div>

        {activeTab === 'planner' ? (
          <div className="space-y-6">
            {/* Local Card (User) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group hover:border-blue-300 transition-colors">
                <div className="flex flex-col mb-2">
                    <div className="flex items-center text-slate-500 text-sm font-medium mb-1">
                      <MapPin size={14} className="mr-1.5" />
                      Your Location
                    </div>
                    <div className="relative">
                      <select 
                        value={userTimezone} 
                        onChange={(e) => setUserTimezone(e.target.value)}
                        className="appearance-none w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer font-medium"
                      >
                        {availableTimezones.map(tz => (
                          <option key={tz.value} value={tz.value}>{tz.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                <div className="flex items-baseline justify-between mt-4">
                    <div className="text-4xl font-bold text-slate-800 tracking-tight">
                        {formatTime(now, userTimezone)}
                    </div>
                    <div className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                        {getAbbreviation(now, userTimezone)}
                    </div>
                </div>
                
                <div className="text-sm text-slate-500 mt-1 font-medium">
                    {formatDate(now, userTimezone)}
                </div>
                
                <div className="absolute top-5 right-5 text-slate-100 group-hover:text-blue-50 transition-colors pointer-events-none">
                   <Clock size={48} />
                </div>
            </div>

            {/* Client Card */}
            <div className="bg-blue-600 p-5 rounded-xl border border-blue-700 shadow-md text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Globe size={120} className="text-white" />
                 </div>
                 
                 <div className="relative z-10 flex flex-col">
                    <div className="flex items-center text-blue-100 text-sm font-medium mb-1">
                      <MapPin size={14} className="mr-1.5" />
                      Client Location
                    </div>
                    <div className="relative">
                       <select 
                        value={clientTimezone} 
                        onChange={(e) => setClientTimezone(e.target.value)}
                        className="appearance-none w-full bg-blue-700/50 border border-blue-500/30 text-white text-sm rounded-lg p-2 pr-8 focus:ring-2 focus:ring-white focus:bg-blue-700 outline-none cursor-pointer font-medium [&>option]:text-slate-800"
                      >
                        {availableTimezones.map(tz => (
                          <option key={tz.value} value={tz.value}>{tz.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-3 text-blue-200 pointer-events-none" />
                    </div>

                    <div className="flex items-baseline justify-between mt-4">
                        <div className="text-4xl font-bold text-white tracking-tight">
                            {formatTime(now, clientTimezone)}
                        </div>
                        <div className="text-sm font-bold text-blue-100 bg-blue-500/30 px-2 py-1 rounded border border-blue-400/30">
                            {getAbbreviation(now, clientTimezone)}
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                         <span className="text-sm text-blue-100 font-medium">
                            {formatDate(now, clientTimezone)}
                        </span>
                    </div>
                 </div>
            </div>

            {/* Bi-directional Meeting Planner */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center">
                    <Calendar size={16} className="mr-2 text-blue-600" />
                    Meeting Planner
                </h3>
                
                <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 items-center">
                    <div className="flex-1 w-full">
                        <label className="block text-xs text-slate-500 mb-1 font-medium">Your Date & Time</label>
                        <input 
                            type="datetime-local" 
                            value={userMeetingTime}
                            onChange={handleUserTimeChange}
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all shadow-sm"
                        />
                    </div>
                    
                    <div className="text-slate-400">
                        <ArrowLeftRight size={20} className="rotate-90 md:rotate-0" />
                    </div>
                    
                    <div className="flex-1 w-full">
                        <label className="block text-xs text-slate-500 mb-1 font-medium">Client Date & Time</label>
                        <input 
                            type="datetime-local" 
                            value={clientMeetingTime}
                            onChange={handleClientTimeChange}
                            className="w-full p-2 border border-blue-200 rounded-lg text-sm bg-blue-50 text-blue-700 font-semibold focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all shadow-sm"
                        />
                    </div>
                </div>
                 <p className="text-xs text-slate-400 mt-3 text-center leading-relaxed">
                    Select a date and time to see the corresponding local time for the other party.
                </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Regional Selector */}
            <div className="flex justify-center mb-2">
                <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200">
                    <button 
                        onClick={() => setRegionalView('IST')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center ${regionalView === 'IST' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        🇮🇳 India (IST)
                    </button>
                    <button 
                        onClick={() => setRegionalView('NY')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center ${regionalView === 'NY' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        🇺🇸 New York (ET)
                    </button>
                </div>
            </div>

            {/* Regional Hero Card */}
            <div className={`p-5 rounded-xl border shadow-sm relative overflow-hidden transition-colors duration-300 ${getThemeClasses('bg')} ${getThemeClasses('border')}`}>
                <div className="relative z-10">
                  <div className={`flex items-center mb-2 ${regionalView === 'IST' ? 'text-orange-800' : 'text-indigo-800'}`}>
                      <Clock size={16} className="mr-2" />
                      <span className="font-semibold text-sm uppercase tracking-wider">{refLabel}</span>
                  </div>
                  <div className="flex items-baseline space-x-3">
                    <div className={`text-4xl font-bold tracking-tight ${regionalView === 'IST' ? 'text-orange-900' : 'text-indigo-900'}`}>
                        {formatTime(now, refTimezone)}
                    </div>
                    <div className={`text-sm font-bold px-2 py-0.5 rounded ${getThemeClasses('light-bg')} ${getThemeClasses('text')}`}>
                        {getAbbreviation(now, refTimezone)}
                    </div>
                  </div>
                  <div className={`text-sm font-medium mt-1 ${getThemeClasses('text')}`}>
                      {formatDate(now, refTimezone)}
                  </div>
                </div>
                <div className={`absolute -bottom-6 -right-6 opacity-20 ${getThemeClasses('text')}`}>
                   <Globe size={100} />
                </div>
            </div>

            {/* Quick Conversion Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
               <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Live Comparison</h3>
               </div>
               <div className="divide-y divide-slate-100">
                  {/* Row 1: User vs Ref */}
                  <div className="p-4 flex items-center justify-between">
                      <div>
                         <div className="text-xs text-slate-400 mb-1">Your Time ({getAbbreviation(now, userTimezone)})</div>
                         <div className="text-sm font-semibold text-slate-700">{formatTime(now, userTimezone)}</div>
                      </div>
                      <ArrowRight size={14} className="text-slate-300" />
                      <div className="text-right">
                         <div className={`text-xs mb-1 ${regionalView === 'IST' ? 'text-orange-400' : 'text-indigo-400'}`}>{refShort} ({getAbbreviation(now, refTimezone).split(' ')[0]})</div>
                         <div className={`text-sm font-bold ${getThemeClasses('text')}`}>{formatTime(now, refTimezone)}</div>
                      </div>
                  </div>
                  
                  {/* Row 2: Client vs Ref */}
                  <div className="p-4 flex items-center justify-between bg-slate-50/50">
                      <div>
                         <div className="text-xs text-slate-400 mb-1">Client ({getAbbreviation(now, clientTimezone)})</div>
                         <div className="text-sm font-semibold text-slate-700">{formatTime(now, clientTimezone)}</div>
                      </div>
                      <ArrowRight size={14} className="text-slate-300" />
                      <div className="text-right">
                         <div className={`text-xs mb-1 ${regionalView === 'IST' ? 'text-orange-400' : 'text-indigo-400'}`}>{refShort} ({getAbbreviation(now, refTimezone).split(' ')[0]})</div>
                         <div className={`text-sm font-bold ${getThemeClasses('text')}`}>{formatTime(now, refTimezone)}</div>
                      </div>
                  </div>
               </div>
            </div>

            {/* Planned Meeting in Ref Zone */}
            {userMeetingTime ? (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-2">
                 <div className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-3 flex items-center">
                    <Calendar size={12} className="mr-1.5" />
                    Selected Meeting ({refShort} Conversion)
                 </div>
                 <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                     <div>
                         <div className="text-xs text-slate-400">Selected Time</div>
                         <div className="font-semibold text-slate-800 text-sm">
                            {(() => {
                               const d = localStringToDate(userMeetingTime, userTimezone);
                               return d ? new Intl.DateTimeFormat('en-US', {hour: 'numeric', minute:'numeric'}).format(d) : '--';
                            })()}
                         </div>
                     </div>
                     <ArrowRight size={16} className="text-blue-200" />
                     <div className="text-right">
                         <div className={`text-xs ${regionalView === 'IST' ? 'text-orange-500' : 'text-indigo-500'}`}>In {regionalView === 'IST' ? 'India' : 'New York'} ({getAbbreviation(localStringToDate(userMeetingTime, userTimezone) || now, refTimezone)})</div>
                         <div className={`font-bold text-sm ${getThemeClasses('text')}`}>
                             { (() => {
                                 const d = localStringToDate(userMeetingTime, userTimezone);
                                 return d ? formatTime(d, refTimezone) : '--';
                             })() }
                         </div>
                         <div className={`text-[10px] ${regionalView === 'IST' ? 'text-orange-400' : 'text-indigo-400'}`}>
                             { (() => {
                                 const d = localStringToDate(userMeetingTime, userTimezone);
                                 return d ? formatDate(d, refTimezone) : '';
                             })() }
                         </div>
                     </div>
                 </div>
              </div>
            ) : (
                <div className="text-center p-4 text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    Use the Planner tab to set a meeting time and see it converted to {refShort} here.
                </div>
            )}
          </div>
        )}
    </div>
  );
};