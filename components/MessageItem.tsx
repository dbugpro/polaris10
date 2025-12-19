import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import { ExternalLink, User, Compass } from 'lucide-react';

interface MessageItemProps {
  message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-2xl ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-6`}>
        
        {/* Avatar Overlay */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
          ${isUser ? 'bg-slate-800' : 'bg-cyan-500'}
          shadow-[0_0_20px_rgba(0,0,0,0.5)] relative mt-1 overflow-hidden
        `}>
          {isUser ? (
            <User size={18} className="text-slate-400" /> 
          ) : (
            <Compass size={20} className="text-white animate-pulse" />
          )}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"></div>
        </div>

        {/* Content Bubble */}
        <div className={`
          flex flex-col 
          ${isUser ? 'items-end' : 'items-start'}
          flex-1
        `}>
          <div className={`
            px-1 py-1 text-sm md:text-base leading-relaxed tracking-wide
            ${isUser ? 'text-slate-200 text-right' : 'text-slate-100'}
          `}>
            {message.image && (
              <div className="mb-6 p-1 glass-panel rounded-2xl inline-block">
                <img 
                  src={message.image} 
                  alt="Navigation target" 
                  className="max-w-full h-auto rounded-xl border border-white/5" 
                  style={{ maxHeight: '300px' }}
                />
              </div>
            )}
            
            <div className={`
              markdown-content prose prose-invert prose-sm max-w-none break-words
              ${isUser ? 'opacity-80' : 'font-light leading-relaxed'}
            `}>
              <ReactMarkdown>{message.text}</ReactMarkdown>
            </div>
          </div>

          {/* Source Navigation */}
          {!isUser && message.groundingSources && message.groundingSources.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3 animate-in fade-in duration-1000 delay-500">
              {message.groundingSources.map((source, idx) => (
                <a 
                  key={idx} 
                  href={source.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 rounded-full text-[10px] text-cyan-400/80 transition-all uppercase tracking-widest font-bold"
                >
                  <ExternalLink size={10} />
                  <span>{source.title}</span>
                </a>
              ))}
            </div>
          )}
          
          <span className="text-[9px] text-slate-600 mt-4 px-1 font-bold uppercase tracking-[0.2em]">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};