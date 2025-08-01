import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeChat, sendMessage } from '../services/geminiService.ts';
import { ChapterIdentifier, ChatMessage } from '../types.ts';
import { PaperAirplaneIcon } from './Icons.tsx';
import { marked } from 'marked';

interface ChatPanelProps {
  chapterIdentifier: ChapterIdentifier;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ chapterIdentifier }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const setupChat = useCallback(() => {
    setMessages([]);
    initializeChat(chapterIdentifier);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterIdentifier]);

  useEffect(() => {
    setupChat();
  }, [setupChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const modelMessage: ChatMessage = { role: 'model', content: '' };
    setMessages((prev) => [...prev, modelMessage]);

    try {
      const stream = await sendMessage(input);
      let text = '';
      for await (const chunk of stream) {
        text += chunk.text;
        setMessages((prev) =>
          prev.map((msg, index) =>
            index === prev.length - 1 ? { ...msg, content: text } : msg
          )
        );
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) =>
          prev.map((msg, index) =>
            index === prev.length - 1 ? { ...msg, content: 'Sorry, an error occurred.' } : msg
          )
        );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${
                msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
              }`}
            >
              <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }} />
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length-1]?.role === 'model' && (
           <div className="flex justify-start">
             <div className="bg-gray-200 text-gray-800 rounded-2xl px-4 py-3">
                 <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-300"></div>
                 </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            className="flex-1 p-3 bg-white border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="p-3 bg-blue-600 text-white rounded-full disabled:bg-blue-300 hover:bg-blue-700 transition-colors"
          >
            <PaperAirplaneIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;