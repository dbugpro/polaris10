import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import { ExternalLink, User, Compass, AlertCircle } from 'lucide-react';

interface MessageItemProps {
  message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-4`}>
        
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
          ${isUser ? 'bg-blue-600' : 'bg-cyan-600'}
          shadow-lg relative
        `}>
          {isUser ? (
            <User size={20} className="text-white" /> 
          ) : (
            <Compass size={22} className="text-white -rotate-45" strokeWidth={2} />
          )}
        </div>

        {/* Bubble */}
        <div className={`
          flex flex-col 
          ${isUser ? 'items-end' : 'items-start'}
        `}>
          <div className={`
            p-4 rounded-2xl glass-panel text-sm md:text-base leading-relaxed shadow-xl
            ${isUser ? 'rounded-tr-none border-blue-500/30' : 'rounded-tl-none border-cyan-500/30'}
            ${message.isError ? 'border-red-500/50 bg-red-900/20' : ''}
          `}>
            {message.image && (
              <img 
                src={message.image} 
                alt="User upload" 
                className="max-w-full h-auto rounded-lg mb-3 border border-white/10" 
                style={{ maxHeight: '300px' }}
              />
            )}
            
            {message.isError ? (
               <div className="flex items-center gap-2 text-red-200">
                 <AlertCircle size={18} />
                 <span>{message.text}</span>
               </div>
            ) : (
              <div className="markdown-content prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{message.text}</ReactMarkdown>
              </div>
            )}
          </div>

          {/* Grounding Sources */}
          {!isUser && message.groundingSources && message.groundingSources.length > 0 && (
            <div className="mt-3 w-full">
              <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Sources</p>
              <div className="flex flex-wrap gap-2">
                {message.groundingSources.map((source, idx) => (
                  <a 
                    key={idx} 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-xs text-cyan-400 transition-colors truncate max-w-xs"
                  >
                    <ExternalLink size={10} />
                    <span className="truncate">{source.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
          
          <span className="text-[10px] text-slate-500 mt-2 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};