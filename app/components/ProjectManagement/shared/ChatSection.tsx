// app/components/ProjectManagement/shared/ChatSection.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface ChatSectionProps {
  chat: Array<{
    userId: string;
    userName: string;
    message: string;
    timestamp: Date | string;
    attachments?: string[];
  }>;
  onSendMessage: (message: string) => Promise<void>;
  currentUserId: string;
  currentUserName: string;
  type: 'project' | 'sprint';
}

export default function ChatSection({
  chat,
  onSendMessage,
  currentUserId,
  currentUserName,
  type
}: ChatSectionProps) {
  const { colors, cardCharacters } = useTheme();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    try {
      setSending(true);
      await onSendMessage(message.trim());
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${colors.cardBg} ${colors.border} ${colors.shadowCard}`}>
      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
      
      <div className="relative">
        {/* Header */}
        <div className={`p-4 border-b ${colors.border} bg-gradient-to-r ${cardCharacters.informative.bg}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${cardCharacters.informative.bg}`}>
              <MessageSquare className={`w-5 h-5 ${cardCharacters.informative.iconColor}`} />
            </div>
            <div>
              <h3 className={`text-base font-black ${cardCharacters.informative.text}`}>
                {type === 'project' ? 'Project' : 'Sprint'} Chat
              </h3>
              <p className={`text-xs ${colors.textMuted}`}>
                {chat.length} message{chat.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Messages - Chat-style layout */}
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
          {chat.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className={`w-12 h-12 mx-auto mb-3 ${colors.textMuted} opacity-40`} />
              <p className={`${colors.textMuted} text-sm`}>
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            <>
              {chat.map((msg, index) => {
                const isCurrentUser = msg.userId === currentUserId || msg.userName === currentUserName;
                
                return (
                  <div
                    key={index}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`group relative overflow-hidden rounded-lg p-3 transition-all max-w-[66%] ${
                        isCurrentUser
                          ? `bg-gradient-to-r ${cardCharacters.interactive.bg} border ${cardCharacters.interactive.border} ml-auto`
                          : `${colors.inputBg} border ${colors.inputBorder} mr-auto`
                      }`}
                    >
                      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                      
                      <div className="relative space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className={`text-sm font-bold ${
                            isCurrentUser ? cardCharacters.interactive.text : colors.textPrimary
                          }`}>
                            {msg.userName}
                            {isCurrentUser && (
                              <span className={`ml-2 text-xs font-normal ${colors.textMuted}`}>
                                (You)
                              </span>
                            )}
                          </span>
                          <span className={`text-xs ${colors.textMuted} whitespace-nowrap`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        
                        <p className={`text-sm ${
                          isCurrentUser ? colors.textPrimary : colors.textSecondary
                        } leading-relaxed break-words`}>
                          {msg.message}
                        </p>

                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {msg.attachments.map((attachment, i) => (
                              <div
                                key={i}
                                className={`px-2 py-1 rounded text-xs ${colors.inputBg} ${colors.textMuted}`}
                              >
                                📎 {attachment.split('/').pop()}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className={`p-4 border-t ${colors.border}`}>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              className={`flex-1 px-4 py-3 rounded-lg text-sm ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder} disabled:opacity-50`}
            />
            <button
              type="submit"
              disabled={!message.trim() || sending}
              className={`group relative px-6 py-3 rounded-lg font-bold text-sm transition-all overflow-hidden bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105`}
            >
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}` }}
              ></div>
              
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin relative z-10" />
              ) : (
                <Send className="w-5 h-5 relative z-10" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}