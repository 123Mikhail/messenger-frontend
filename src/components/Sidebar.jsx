import React from 'react';

export default function Sidebar({ chats, activeChat, onSelectChat, searchQuery, setSearchQuery }) {
  return (
    <>
      {/* Полупрозрачная шапка с размытием */}
      <div className="p-3 border-b border-white/20 flex items-center gap-2 glass-panel shadow-inner">
        <button className="p-2 hover:bg-white/40 rounded-full text-gray-500 backdrop-blur-sm">
          ☰
        </button>
        <input 
          type="text" 
          placeholder="Поиск..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-white/40 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-tg-primary/70 transition-all text-sm backdrop-blur-sm text-gray-800 placeholder-gray-600"
        />
      </div>

      {/* Список чатов */}
      <div className="flex-1 overflow-y-auto">
        {chats.map(chat => (
          <div 
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className={`flex items-center p-3 cursor-pointer transition-colors ${activeChat?.id === chat.id ? 'bg-tg-primary text-white' : 'hover:bg-white/10'}`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mr-3 shadow-md ${activeChat?.id === chat.id ? 'bg-white text-tg-primary' : 'bg-gradient-to-tr from-tg-primary/80 to-tg-primary text-white'}`}>
              {chat.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <h3 className={`font-semibold truncate ${activeChat?.id === chat.id ? 'text-white' : 'text-gray-900'}`}>{chat.name}</h3>
                <span className={`text-xs ${activeChat?.id === chat.id ? 'text-blue-100' : 'text-gray-400'}`}>{chat.time}</span>
              </div>
              <p className={`text-sm truncate ${activeChat?.id === chat.id ? 'text-blue-100' : 'text-gray-500'}`}>
                {chat.lastMessage}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Полупрозрачная кнопка */}
      <button className="absolute bottom-6 left-[calc(25%-3rem)] md:left-[calc(33%-4rem)] w-14 h-14 bg-tg-primary rounded-full text-white shadow-xl flex items-center justify-center hover:bg-tg-primary/80 transition-transform hover:scale-105 backdrop-blur-sm">
        +
      </button>
    </>
  );
}