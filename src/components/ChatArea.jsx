import React, { useState, useEffect } from 'react';

export default function ChatArea({ chat, onBack }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    setMessages([
      { id: 1, text: 'Привет! Как продвигается лаба?', sender: 'Alice', isMine: false, time: "11:59" },
      { id: 2, text: 'Пишу клиент на React, делаю дизайн под телегу', sender: 'You', isMine: true, time: "12:00" },
      { id: 3, text: 'Никак не могу понять, как сделать эффект жидкого стекла, как в телеграме.', sender: 'You', isMine: true, time: "12:01" },
      { id: 4, text: 'Надо было конфиги Tailwind правильно настроить.', sender: 'You', isMine: true, time: "12:02" }
    ]);
  }, [chat.id]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (editingId) {
      setMessages(msgs => msgs.map(m => m.id === editingId ? { ...m, text: inputText } : m));
      setEditingId(null);
    } else {
      const newMessage = { id: Date.now(), text: inputText, sender: 'You', isMine: true, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setMessages([...messages, newMessage]);
    }
    setInputText('');
  };

  const handleDelete = (id) => {
    setMessages(msgs => msgs.filter(m => m.id !== id));
  };

  return (
    <>
      {}
      <div className="p-3 border-b border-white/20 flex items-center gap-2 glass-panel shadow-md z-10">
        <button onClick={onBack} className="md:hidden mr-3 text-tg-primary font-bold backdrop-blur-sm p-1 rounded-full hover:bg-white/20">←</button>
        <div className="w-10 h-10 rounded-full bg-tg-primary text-white flex items-center justify-center mr-3 font-bold">
          {chat.name.charAt(0)}
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">{chat.name}</h2>
          <p className="text-xs text-tg-primary">В сети</p>
        </div>
      </div>

      {/* Список сообщений (Связь OneToMany) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-pattern-bg shadow-inner">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}>
            {/* Полупрозрачные bubbles с размытием */}
            <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow group ${msg.isMine ? 'bg-tg-chat-mine rounded-br-none' : 'bg-tg-chat-other rounded-bl-none'} backdrop-blur-sm border border-white/10`}>
              {!msg.isMine && <span className="text-xs text-tg-primary font-semibold mb-1 block">{msg.sender}</span>}
              <p className="text-[15px]">{msg.text}</p>
              <span className={`text-[11px] block mt-1 ${msg.isMine ? 'text-gray-600 text-right' : 'text-gray-500'}`}>{msg.time}</span>
              
              {/* CRUD Кнопки */}
              {msg.isMine && (
                <div className="absolute -left-16 top-2 hidden group-hover:flex gap-2">
                  <button onClick={() => { setEditingId(msg.id); setInputText(msg.text); }} className="text-gray-400 hover:text-tg-primary text-xs">✎</button>
                  <button onClick={() => handleDelete(msg.id)} className="text-gray-400 hover:text-red-500 text-xs">🗑</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Полупрозрачное поле ввода */}
      <div className="p-3 border-t border-white/20 glass-panel mt-auto">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Написать сообщение..." 
            className="flex-1 bg-white/50 rounded-full px-5 py-3 outline-none focus:ring-2 focus:ring-tg-primary/70 transition-all backdrop-blur-sm text-gray-800 placeholder-gray-600"
          />
          <button type="submit" className="w-12 h-12 bg-tg-primary rounded-full text-white flex items-center justify-center hover:bg-tg-primary/80 backdrop-blur-sm">
            ➤
          </button>
        </form>
      </div>
    </>
  );
}