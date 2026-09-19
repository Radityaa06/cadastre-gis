import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  MapPin, 
  Filter, 
  RotateCcw, 
  ExternalLink, 
  ChevronRight, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Landmark, 
  Search,
  Maximize2,
  Minimize2,
  Trash2,
  HelpCircle,
  Eye
} from 'lucide-react';
import { CadastralParcel, VaraiChatMessage, VaraiMatchingParcelItem } from '../types';
import { apiUrl } from '../services/api';

interface VaraiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  parcels: CadastralParcel[];
  selectedParcel: CadastralParcel | null;
  onSelectParcel: (parcel: CadastralParcel | null) => void;
  onFilterParcels: (parcelIds: string[] | null) => void;
  onHighlightParcels: (parcelIds: string[]) => void;
  activeFilterIds: string[] | null;
  activeHighlightIds: string[];
  onNavigateTab: (tab: 'google-maps' | 'drone-images' | 'digital-twin' | 'dharnav-loop') => void;
  activeTab: string;
}

const QUICK_PROMPT_PILLS = [
  { label: '🏛️ Disputed Deeds', prompt: 'Which parcels have legal deed disputes or boundary encroachments?' },
  { label: '⚖️ Deed Solutions', prompt: 'Show deed problem solutions, remedies, and Form 14A rectification options' },
  { label: '🏭 Industrial > 3 ac', prompt: 'Show all industrial or logistics parcels with area greater than 3 acres' },
  { label: '🏢 Digital Twin Sims', prompt: 'Show parcels with What-If simulations and 3D solar shadow models' },
  { label: '⚠️ Needs Review', prompt: 'Which parcels have low AI confidence or need surveyor review?' },
  { label: '💰 Tax > $2M', prompt: 'List all parcels with tax assessment value above $2,000,000' },
  { label: '🗺️ Reset Filter', prompt: 'Reset map filter and show all cadastral parcels' },
];

export const VaraiChatDrawer: React.FC<VaraiChatDrawerProps> = ({
  isOpen,
  onClose,
  parcels,
  selectedParcel,
  onSelectParcel,
  onFilterParcels,
  onHighlightParcels,
  activeFilterIds,
  activeHighlightIds,
  onNavigateTab,
  activeTab,
}) => {
  const [messages, setMessages] = useState<VaraiChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'varai',
      text: `Hello! I am **VARAI.ai**, your specialized Cadastral GIS & Spatial AI Agent.

I understand natural language questions regarding our cadastral GIS survey data:
• **Understands questions** about zoning, acreage, owners, PINs, and coordinates
• **Queries live GIS data** across ${parcels.length} active parcels
• **Filters the map** to isolate matching parcels
• **Highlights parcels** with high-visibility markers & glowing outlines
• **Provides exact counts & explicit reasons** for every match

Try asking me a question below or pick a quick action!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputMessage).trim();
    if (!prompt || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMessage: VaraiChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build conversation history for multi-turn context
      const historyPayload = messages.slice(-8).map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('model' as const),
        content: m.text,
      }));

      const response = await fetch(apiUrl('/api/varai/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          history: historyPayload,
          parcels,
          activeTab,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        const result = data.data;
        const matchingItems: VaraiMatchingParcelItem[] = result.matchingParcels || [];

        const varaiMsg: VaraiChatMessage = {
          id: `varai-${Date.now()}`,
          sender: 'varai',
          text: result.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          matchCount: result.matchCount,
          matchingParcels: matchingItems,
          action: result.action,
        };

        setMessages((prev) => [...prev, varaiMsg]);

        // Auto-apply map actions
        if (result.action) {
          const matchingIds = matchingItems.map((m) => m.id);

          if (result.action.type === 'reset') {
            onFilterParcels(null);
            onHighlightParcels([]);
          } else if (result.action.type === 'filter') {
            onFilterParcels(matchingIds);
            onHighlightParcels(matchingIds);
          } else if (result.action.type === 'highlight') {
            onHighlightParcels(matchingIds);
          }

          // Center or focus specific parcel
          if (result.action.focusParcelId) {
            const found = parcels.find((p) => p.id === result.action.focusParcelId);
            if (found) {
              onSelectParcel(found);
            }
          }

          // Suggest or switch tab if requested
          if (result.action.suggestedTab && result.action.suggestedTab !== activeTab) {
            if (result.action.suggestedTab === 'google-maps') {
              onNavigateTab('google-maps');
            } else if (result.action.suggestedTab === 'drone-images') {
              onNavigateTab('drone-images');
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Error querying VARAI.ai:', err);
      const errorMsg: VaraiChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'varai',
        text: `Sorry, I encountered an issue processing your query: ${err.message || 'Unknown network error'}. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilter = (ids: string[]) => {
    onFilterParcels(ids);
    onHighlightParcels(ids);
  };

  const handleResetFilter = () => {
    onFilterParcels(null);
    onHighlightParcels([]);
  };

  const handleFocusParcel = (parcelId: string) => {
    const target = parcels.find((p) => p.id === parcelId);
    if (target) {
      onSelectParcel(target);
      onHighlightParcels([parcelId]);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'varai',
        text: `Chat thread cleared. How can I assist with your cadastral GIS analysis?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed z-50 bg-white border border-slate-200 shadow-2xl flex flex-col transition-all duration-200 ${
        isExpanded 
          ? 'inset-4 sm:inset-10 rounded-3xl' 
          : 'bottom-4 right-4 w-[92vw] sm:w-[460px] h-[640px] max-h-[90vh] rounded-2xl'
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900 text-white rounded-t-2xl sm:rounded-t-3xl flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1">
                VARAI.ai
              </h3>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                GIS Linked
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Cadastral Spatial AI • {parcels.length} parcels indexed
            </p>
          </div>
        </div>

        {/* Top Control Icons */}
        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={handleClearHistory}
            className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors hidden sm:block"
            title={isExpanded ? 'Minimize' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
        {QUICK_PROMPT_PILLS.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(qp.prompt)}
            disabled={isLoading}
            className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-full text-[11px] font-semibold border border-slate-200 hover:border-indigo-300 transition-all whitespace-nowrap shadow-2xs shrink-0 flex items-center gap-1 active:scale-95"
          >
            <span>{qp.label}</span>
          </button>
        ))}
      </div>

      {/* Active Filter Notice Bar (if map currently filtered) */}
      {activeFilterIds && (
        <div className="px-3 py-1.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-[11px] flex items-center justify-between">
          <span className="flex items-center gap-1 font-medium">
            <Filter className="w-3.5 h-3.5 text-amber-600" />
            Active Filter: Showing {activeFilterIds.length} of {parcels.length} parcels
          </span>
          <button
            onClick={handleResetFilter}
            className="text-[10px] font-bold text-amber-700 underline hover:text-amber-900"
          >
            Reset
          </button>
        </div>
      )}

      {/* Messages Thread */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
        {messages.map((msg) => {
          const isVarai = msg.sender === 'varai';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isVarai ? 'items-start' : 'items-end'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                {isVarai ? (
                  <span className="text-[11px] font-bold text-indigo-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    VARAI.ai
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-500">You</span>
                )}
                <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[92%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-2xs ${
                  isVarai
                    ? 'bg-white border border-slate-200 text-slate-800'
                    : 'bg-indigo-600 text-white rounded-br-xs'
                }`}
              >
                {/* Text Body with basic markdown formatting */}
                <div className="space-y-1.5 whitespace-pre-wrap">
                  {msg.text.split('\n').map((line, idx) => {
                    if (line.startsWith('• ')) {
                      return (
                        <div key={idx} className="pl-2 border-l-2 border-indigo-300 text-slate-700 py-0.5">
                          {line.replace('• ', '')}
                        </div>
                      );
                    }
                    return <p key={idx}>{line}</p>;
                  })}
                </div>

                {/* If matching parcels were returned */}
                {isVarai && msg.matchingParcels && msg.matchingParcels.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
                    {/* Header with Count Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-extrabold">
                          {msg.matchCount || msg.matchingParcels.length}
                        </span>
                        <span>Matching Parcels & GIS Reasons</span>
                      </span>

                      <button
                        onClick={() => handleApplyFilter(msg.matchingParcels!.map((m) => m.id))}
                        className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-[10px] font-bold flex items-center gap-1 border border-indigo-200 transition-colors"
                      >
                        <Filter className="w-3 h-3" />
                        <span>Filter Map</span>
                      </button>
                    </div>

                    {/* Individual Parcel Cards */}
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {msg.matchingParcels.map((mp) => {
                        const isThisSelected = selectedParcel?.id === mp.id;
                        const isThisFiltered = activeFilterIds?.includes(mp.id);
                        return (
                          <div
                            key={mp.id}
                            className={`p-2.5 rounded-xl border transition-all ${
                              isThisSelected
                                ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-slate-900 text-xs">
                                  {mp.code}
                                </span>
                                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-white border border-slate-200 text-slate-600">
                                  {mp.acres} ac
                                </span>
                                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-indigo-100/60 text-indigo-700">
                                  {mp.zoning}
                                </span>
                              </div>

                              <button
                                onClick={() => handleFocusParcel(mp.id)}
                                className="px-2 py-0.5 bg-white hover:bg-indigo-600 hover:text-white text-slate-700 rounded-lg text-[10px] font-bold border border-slate-200 flex items-center gap-1 transition-all shadow-2xs"
                                title="Center and highlight this parcel"
                              >
                                <MapPin className="w-3 h-3 text-indigo-600" />
                                <span>Focus</span>
                              </button>
                            </div>

                            {/* Reason for match */}
                            <p className="text-[11px] text-slate-600 font-medium">
                              <strong className="text-slate-800">Reason:</strong> {mp.reason}
                            </p>

                            {/* Additional metadata chips */}
                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-500 font-mono">
                              <span>PIN: {mp.pin}</span>
                              {mp.deedStatus && (
                                <span className={mp.deedStatus === 'Disputed' ? 'text-red-600 font-bold' : 'text-emerald-600'}>
                                  Deed: {mp.deedStatus}
                                </span>
                              )}
                              {mp.taxAssessment && (
                                <span>Tax: ${mp.taxAssessment.toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Batch Action Toolbar */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <button
                        onClick={() => handleApplyFilter(msg.matchingParcels!.map((m) => m.id))}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                      >
                        <Filter className="w-3 h-3" />
                        <span>Isolate on Map ({msg.matchingParcels.length})</span>
                      </button>

                      <button
                        onClick={() => onHighlightParcels(msg.matchingParcels!.map((m) => m.id))}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>Highlight Only</span>
                      </button>

                      <button
                        onClick={() => onNavigateTab('google-maps')}
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Google Maps</span>
                      </button>

                      {activeFilterIds && (
                        <button
                          onClick={handleResetFilter}
                          className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors ml-auto"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start gap-2 animate-pulse">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-600 shadow-2xs">
              <span className="font-semibold text-slate-800">VARAI.ai is analyzing GIS query...</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Filtering spatial boundaries, deeds & zoning records</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-white border-t border-slate-200 rounded-b-2xl sm:rounded-b-3xl"
      >
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask VARAI.ai: 'Filter parcels with deed disputes', 'Show M-2 industrial > 3 ac'..."
            disabled={isLoading}
            className="flex-1 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-xs text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl font-bold flex items-center justify-center transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
            title="Send inquiry"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
