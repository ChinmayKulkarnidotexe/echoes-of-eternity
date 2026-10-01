import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Mic, MicOff, Send, Sparkles, MessageSquare, BookOpen, Loader2 } from 'lucide-react';
import { speakText, stopSpeaking, createSpeechRecognition } from '../../services/speech';
import { askQuestion } from '../../services/api';

interface Props {
  contextType: 'poi' | 'painting';
  contextId: number;
  title: string;
  narration: string;
  factsText: string;
  autoPlayAudio?: boolean;
}

export const GuidePanel: React.FC<Props> = ({
  contextType,
  contextId,
  title,
  narration,
  factsText,
  autoPlayAudio = false,
}) => {
  const [showFacts, setShowFacts] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [question, setQuestion] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  // Auto-play narration when POI or painting changes if autoPlayAudio is enabled
  useEffect(() => {
    setAnswer(null);
    setQuestion('');
    if (autoPlayAudio && narration) {
      handlePlaySpeech(narration);
    }
    return () => {
      stopSpeaking();
    };
  }, [contextId, contextType, narration]);

  // Set up speech recognition
  useEffect(() => {
    const rec = createSpeechRecognition(
      (transcript) => {
        setQuestion(transcript);
        setIsListening(false);
        // Automatically ask if transcript was caught
        handleSendQuestion(transcript);
      },
      () => {
        setIsListening(false);
      }
    );
    setRecognitionInstance(rec);
  }, [contextType, contextId]);

  const handlePlaySpeech = (text: string) => {
    stopSpeaking();
    setIsSpeaking(true);
    speakText(text, () => {
      setIsSpeaking(false);
    });
  };

  const handleStopSpeech = () => {
    stopSpeaking();
    setIsSpeaking(false);
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      handleStopSpeech();
    } else {
      handlePlaySpeech(narration);
    }
  };

  const toggleMic = () => {
    if (!recognitionInstance) {
      alert("Voice input is not supported in this browser or permission was denied.");
      return;
    }

    if (isListening) {
      recognitionInstance.stop();
      setIsListening(false);
    } else {
      try {
        setIsListening(true);
        recognitionInstance.start();
      } catch (err) {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
      }
    }
  };

  const handleSendQuestion = async (qToSend?: string) => {
    const q = (qToSend || question).trim();
    if (!q || isLoadingAnswer) return;

    setIsLoadingAnswer(true);
    try {
      const res = await askQuestion(contextType, contextId, q);
      setAnswer(res.answer);
      handlePlaySpeech(res.answer);
    } catch (err) {
      console.error("Ask question error:", err);
      setAnswer("Sorry, I could not retrieve an answer right now. Please try again.");
    } finally {
      setIsLoadingAnswer(false);
    }
  };

  const promptChips = contextType === 'poi'
    ? ["Who built this and why?", "What materials were used?", "What optical illusion is here?"]
    : ["What technique did the artist use?", "What is the historical meaning?", "Where is the original kept?"];

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
      {/* Guide Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
              Gemini AI Audio Docent
            </span>
            <h3 className="text-sm font-semibold text-white line-clamp-1">{title}</h3>
          </div>
        </div>

        {/* Audio Toggle Button */}
        <button
          onClick={toggleSpeech}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            isSpeaking
              ? 'bg-purple-600 text-white shadow-lg animate-pulse'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title={isSpeaking ? "Pause Narration" : "Listen to Narration"}
        >
          {isSpeaking ? (
            <>
              <VolumeX className="w-3.5 h-3.5" /> Mute Guide
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5" /> Listen Audio
            </>
          )}
        </button>
      </div>

      {/* Narration Story Box */}
      <div className="relative bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-2">
        <div className="flex items-start gap-3">
          <BookOpen className="w-4 h-4 text-purple-400 mt-1 shrink-0" />
          <div className="flex-1">
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic">
              "{narration || 'Synthesizing tour narration...'}"
            </p>
          </div>
        </div>

        {factsText && (
          <div className="pt-2 border-t border-slate-800/60 flex flex-col gap-1.5">
            <button
              onClick={() => setShowFacts(!showFacts)}
              className="text-[11px] text-purple-400 hover:text-purple-300 font-medium text-left"
            >
              {showFacts ? '▲ Hide Grounding Facts' : '▼ View AI Grounding Context'}
            </button>
            {showFacts && (
              <p className="text-[11px] text-slate-400 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
                {factsText}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Q&A Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
            Ask the AI Guide Anything
          </span>
          <span className="text-[11px] text-slate-500">Grounded in verified historical facts</span>
        </div>

        {/* Prompt Suggestion Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {promptChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuestion(chip);
                handleSendQuestion(chip);
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-purple-900/40 hover:text-purple-300 text-slate-300 transition-colors whitespace-nowrap border border-slate-700/60"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Free-form Input with Voice Mic & Submit */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuestion();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={`Ask a question about ${title.split('-')[0].trim()}...`}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all pr-10"
            />
            <button
              type="button"
              onClick={toggleMic}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
                isListening
                  ? 'bg-red-600 text-white animate-bounce'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={isListening ? "Listening... click to stop" : "Speak question with microphone"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={!question.trim() || isLoadingAnswer}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shrink-0"
          >
            {isLoadingAnswer ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" /> Ask
              </>
            )}
          </button>
        </form>

        {/* AI Answer Card */}
        {answer && (
          <div className="bg-purple-950/40 border border-purple-800/60 rounded-xl p-3.5 mt-1 animate-fadeIn flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" /> Docent Answer
              </span>
              <button
                onClick={() => handlePlaySpeech(answer)}
                className="text-[11px] text-purple-400 hover:text-purple-200 flex items-center gap-1 font-medium"
              >
                <Volume2 className="w-3 h-3" /> Speak
              </button>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">{answer}</p>
          </div>
        )}
      </div>
    </div>
  );
};
