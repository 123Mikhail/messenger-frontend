import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { 
  getChats, getMessagesPaged, sendMessage, getUsers, createChat, 
  updateChatTitle, addChatMember, removeChatMember, 
  deleteMessage, updateMessage, deleteChat, uploadFile,
  updateUsername, deleteUser
} from '../api/axiosConfig';

const IconChats = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.303.025-.607.047-.912.066a48.623 48.623 0 0 1-5.595 0 48.682 48.682 0 0 1-5.595 0 48.682 48.682 0 0 1-.912-.066 2.188 2.188 0 0 1-1.98-2.193V10.608c0-.969.616-1.813 1.5-2.097a48.11 48.11 0 0 1 11.49 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75M12 3v13.5M15.75 6.75" /></svg>;
const IconProfile = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>;
const IconAttach = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.07 7.07a1.5 1.5 0 0 0 2.122 2.121l7.07-7.07a1.5 1.5 0 0 0-2.122-2.121Z" /></svg>;
const IconDocument = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>;

export default function Messenger() {
  const currentUsername = localStorage.getItem('username');
  const currentEmail = localStorage.getItem('email');
  
  const [activeTab, setActiveTab] = useState('chats');
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [activeForum, setActiveForum] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [allGlobalChats, setAllGlobalChats] = useState([]);
  const [allGlobalUsers, setAllGlobalUsers] = useState([]);

  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  const [modalConfig, setModalConfig] = useState(null); 
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  const [stompClient, setStompClient] = useState(null);
  const subscriptionRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  const fetchData = () => {
    getChats().then(res => {
      const myChats = res.data.filter(chat => chat.members && chat.members.some(member => member.email === currentEmail));
      setChats(myChats);
      setAllGlobalChats(res.data);
      setActiveChat(prev => prev ? (myChats.find(c => c.id === prev.id) || null) : null);
      setActiveForum(prev => prev ? (myChats.find(c => c.id === prev.id) || null) : null);
    }).catch(console.error);

    getUsers().then(res => setAllGlobalUsers(res.data)).catch(console.error);
  };

  const loadMessages = (chatId, pageToLoad = 0, append = false, forceScroll = false) => {
    if (!chatId) return;
    const container = chatContainerRef.current;
    const scrollHeightBefore = container ? container.scrollHeight : 0;

    getMessagesPaged(chatId, pageToLoad, 30).then(res => {
      let fetchedMessages = res.data.content || [];
      fetchedMessages.reverse(); 
      setHasMoreMessages(fetchedMessages.length === 30);
      
      if (append) {
        setMessages(prev => [...fetchedMessages, ...prev]);
        setTimeout(() => { if (container) container.scrollTop = container.scrollHeight - scrollHeightBefore; }, 0);
      } else {
        setMessages(fetchedMessages);
        if (forceScroll) setTimeout(() => scrollToBottom(false), 100);
      }
    }).catch(console.error);
  };

  useEffect(() => {
    const socket = new SockJS('https://messenger-xmx7.onrender.com/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      onConnect: () => setStompClient(client),
      onStompError: (err) => console.error('WS Error:', err)
    });
    client.activate();
    
    fetchData();

    const chatInterval = setInterval(fetchData, 10000); 
    
    return () => {
      client.deactivate();
      clearInterval(chatInterval);
    };
  }, []);

  useEffect(() => {
    if (activeChat?.id) {
      setCurrentPage(0);
      loadMessages(activeChat.id, 0, false, true); 

      if (stompClient && stompClient.connected) {
        if (subscriptionRef.current) subscriptionRef.current.unsubscribe();

        subscriptionRef.current = stompClient.subscribe(`/topic/chats/${activeChat.id}`, (msgResponse) => {
          const newMsg = JSON.parse(msgResponse.body);
          
          setMessages(prev => {
            if (newMsg.content === '[DELETED]') {
              return prev.filter(m => m.id !== newMsg.id);
            }
            const exists = prev.findIndex(m => m.id === newMsg.id);
            if (exists !== -1) {
              const updated = [...prev];
              updated[exists] = newMsg;
              return updated;
            }
            return [...prev, newMsg];
          });
          
          if (newMsg.content !== '[DELETED]') {
            setTimeout(() => scrollToBottom(true), 50);
          }
        });
      }
    }
    return () => {
      if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
    };
  }, [activeChat?.id, stompClient]);

  const loadMoreHistory = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadMessages(activeChat.id, nextPage, true, false);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    if (editingMessage) {
      updateMessage(editingMessage.id, inputText).then(() => {
        setEditingMessage(null); setInputText('');
      });
    } else {
      sendMessage({ content: inputText, sender: currentUsername, chatId: activeChat.id }).then(() => {
        setInputText('');
      });
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeChat) return;
    try {
      const res = await uploadFile(file);
      await sendMessage({ content: `Файл: ${file.name}`, sender: currentUsername, chatId: activeChat.id, fileUrl: res.data });
    } catch (err) { alert("Ошибка загрузки файла"); }
  };

  const handleUpdateProfile = () => {
    const userId = localStorage.getItem('userId');
    if (!newProfileName.trim() || !userId) return;
    updateUsername(userId, newProfileName).then(() => {
      localStorage.setItem('username', newProfileName);
      alert('Имя успешно изменено!'); window.location.reload(); 
    }).catch(console.error);
  };

  const handleDeleteProfile = () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    if (window.confirm('ВЫ УВЕРЕНЫ? Аккаунт будет удален навсегда!')) {
      deleteUser(userId).then(() => { localStorage.clear(); window.location.href = '/login'; });
    }
  };

  const joinChannel = (chatId) => {
    addChatMember(chatId, currentUsername).then(() => {
      alert('Вы успешно присоединились к каналу!');
      setSearchQuery('');
      fetchData();
    });
  };

  const startDirectMessage = (targetUser) => {
    const existingDM = chats.find(c => 
      c.type === 'GROUP' && !c.parentId && c.members?.length === 2 && 
      c.members.some(m => m.email === targetUser.email)
    );

    if (existingDM) {
      setActiveChat(existingDM);
      setSearchQuery('');
    } else {
      createChat(`Чат с ${targetUser.username}`, [targetUser.username, currentUsername], null, 'GROUP').then(() => {
        setSearchQuery('');
        fetchData();
        alert('Приватный чат создан! Выберите его в списке.');
      });
    }
  };

  const closeModal = () => { setModalConfig(null); setInputValue(''); setSelectedUsers([]); };

  const openCreateChatModal = () => {
    getUsers().then(res => {
      setAllUsers(res.data.filter(u => u.email !== currentEmail));
      setModalConfig({ type: 'CREATE_CHAT', chatType: 'GROUP' });
    }).catch(console.error);
  };

  const executeCreateChat = () => {
    if (!inputValue.trim() || selectedUsers.length === 0) return alert("Заполните все поля!");
    createChat(inputValue, [...selectedUsers, currentUsername], null, modalConfig.chatType).then(() => {
      closeModal(); fetchData();
    }).catch(console.error);
  };

  const openAddMemberModal = () => {
    setShowChatMenu(false);
    getUsers().then(res => {
      const currentMemberEmails = activeChat.members.map(m => m.email);
      setAllUsers(res.data.filter(u => !currentMemberEmails.includes(u.email)));
      setModalConfig({ type: 'ADD_MEMBER' });
    });
  };

  const executeAddMembers = () => {
    Promise.all(selectedUsers.map(user => addChatMember(activeChat.id, user)))
      .then(() => { closeModal(); fetchData(); });
  };

  const openSubChatModal = () => { setShowChatMenu(false); setModalConfig({ type: 'CREATE_SUBCHAT' }); };
  const executeCreateSubChat = () => {
    createChat(inputValue, activeChat.members.map(m => m.username), activeChat.id, 'GROUP')
      .then(() => { closeModal(); fetchData(); });
  };

  const openRenameModal = () => { setShowChatMenu(false); setInputValue(activeChat.title); setModalConfig({ type: 'RENAME_CHAT' }); };
  const executeRename = () => { updateChatTitle(activeChat.id, inputValue).then(() => { closeModal(); fetchData(); }); };

  const openConfirmLeave = () => {
    setShowChatMenu(false);
    setModalConfig({ 
      type: 'CONFIRM', title: 'Выход', message: `Покинуть "${activeChat.title}"?`,
      action: () => { removeChatMember(activeChat.id, currentUsername).then(() => { setActiveChat(null); closeModal(); fetchData(); }) }
    });
  };

  const openConfirmDeleteChat = () => {
    setShowChatMenu(false);
    setModalConfig({
      type: 'CONFIRM', title: 'Удалить чат', message: 'Удалить чат для всех?',
      action: () => { deleteChat(activeChat.id).then(() => { setActiveForum(null); setActiveChat(null); closeModal(); fetchData(); }) }
    });
  };

  const openConfirmDeleteMessage = (msgId) => {
    setSelectedMessageId(null);
    setModalConfig({
      type: 'CONFIRM', title: 'Удалить сообщение', message: 'Удалить это сообщение у всех?',
      action: () => deleteMessage(msgId).then(() => { closeModal(); })
    });
  };

  const handleLogout = () => { localStorage.clear(); window.location.href = '/login'; };
  const formatTime = (ts) => ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
  const startEditingMessage = (msg) => { setEditingMessage(msg); setInputText(msg.content); setSelectedMessageId(null); };

  const isOwner = activeChat?.members && activeChat.members.length > 0 && activeChat.members[0].username === currentUsername;
  const canWrite = activeChat?.type === 'GROUP' || isOwner;

  const renderSidebarContent = () => {
    if (!searchQuery) {
      if (activeForum) {
        const subChats = chats.filter(c => c.parentId === activeForum.id);
        return (
          <div className="flex flex-col animate-fade-in-fast">
            <div className="bg-[#179cde]/10 p-3 flex items-center border-b border-white/20 sticky top-0 z-10 backdrop-blur-md">
              <button onClick={() => setActiveForum(null)} className="mr-3 text-[#179cde] hover:bg-white/30 p-2 rounded-full">←</button>
              <span className="font-bold text-[#179cde] truncate text-sm">{activeForum.title}</span>
            </div>
            <div onClick={() => setActiveChat(activeForum)} className={`p-4 border-b border-white/5 cursor-pointer flex items-center ${activeChat?.id === activeForum.id ? 'bg-[#179cde]/20 border-l-4 border-[#179cde]' : 'hover:bg-white/10'}`}>
              <span className="mr-3 font-bold text-gray-400">#</span><h3 className="font-bold text-gray-800 text-sm">General</h3>
            </div>
            {subChats.map(subChat => (
              <div key={subChat.id} onClick={() => setActiveChat(subChat)} className={`p-4 border-b border-white/5 cursor-pointer flex items-center ${activeChat?.id === subChat.id ? 'bg-[#179cde]/20 border-l-4 border-[#179cde]' : 'hover:bg-white/10'}`}>
                <span className="mr-3 font-bold text-gray-400">↳</span><h3 className="font-semibold text-gray-800 text-sm truncate">{subChat.title}</h3>
              </div>
            ))}
          </div>
        );
      }

      const rootChats = chats.filter(chat => !chat.parentId);
      if (rootChats.length === 0) return <p className="text-center text-slate-400 mt-10">У вас пока нет чатов</p>;

      return rootChats.map(rootChat => {
        const hasSubChats = chats.some(c => c.parentId === rootChat.id);
        return (
          <div key={rootChat.id} onClick={() => hasSubChats ? setActiveForum(rootChat) : setActiveChat(rootChat)} className={`p-4 border-b border-white/5 cursor-pointer flex items-center group ${!hasSubChats && activeChat?.id === rootChat.id ? 'bg-[#179cde] text-white' : 'hover:bg-white/20'}`}>
            <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center font-bold text-white mr-3 ${!hasSubChats && activeChat?.id === rootChat.id ? 'bg-white/20' : 'bg-gradient-to-tr from-[#179cde] to-[#60b6e6]'}`}>
              {hasSubChats ? '📁' : rootChat.title.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex gap-2 items-center">
                <h3 className={`font-bold truncate text-[15px] ${!hasSubChats && activeChat?.id === rootChat.id ? 'text-white' : 'text-gray-800'}`}>{rootChat.title}</h3>
                {rootChat.type === 'CHANNEL' && <span className="bg-orange-100 text-orange-600 text-[9px] font-black px-1.5 rounded">КАНАЛ</span>}
              </div>
              <p className={`text-[12px] truncate ${!hasSubChats && activeChat?.id === rootChat.id ? 'text-blue-100' : 'text-gray-500'}`}>{hasSubChats ? 'Форум • Нажмите' : 'Чат'}</p>
            </div>
          </div>
        );
      });
    }

    const localChats = chats.filter(chat => chat.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const globalChannels = allGlobalChats.filter(c => c.type === 'CHANNEL' && !c.members?.some(m => m.email === currentEmail) && c.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const globalUsers = allGlobalUsers.filter(u => u.email !== currentEmail && (u.username.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())));

    return (
      <div className="p-3 space-y-4 animate-fade-in-fast">
        {localChats.length > 0 && (
          <div>
            <h3 className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest px-2">Мои чаты</h3>
            {localChats.map(chat => (
              <div key={chat.id} onClick={() => setActiveChat(chat)} className="p-3 bg-white rounded-2xl mb-1 cursor-pointer flex items-center hover:bg-blue-50 transition-colors shadow-sm">
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#179cde] to-[#60b6e6] text-white flex items-center justify-center font-bold mr-3">{chat.title.charAt(0).toUpperCase()}</div>
                 <h4 className="font-bold text-slate-800 text-sm truncate">{chat.title}</h4>
              </div>
            ))}
          </div>
        )}

        {globalChannels.length > 0 && (
          <div>
            <h3 className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest px-2">Публичные каналы</h3>
            {globalChannels.map(channel => (
              <div key={channel.id} className="p-3 bg-orange-50 rounded-2xl mb-1 flex items-center justify-between shadow-sm border border-orange-100">
                 <div className="min-w-0 pr-2">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{channel.title}</h4>
                    <p className="text-[10px] text-orange-500 font-bold uppercase">{channel.members?.length || 0} уч.</p>
                 </div>
                 <button onClick={() => joinChannel(channel.id)} className="bg-orange-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs hover:bg-orange-600 transition-colors">Вступить</button>
              </div>
            ))}
          </div>
        )}

        {globalUsers.length > 0 && (
          <div>
            <h3 className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest px-2">Люди</h3>
            {globalUsers.map(user => (
              <div key={user.id} className="p-3 bg-blue-50 rounded-2xl mb-1 flex items-center justify-between shadow-sm border border-blue-100">
                 <div className="min-w-0 pr-2">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{user.username}</h4>
                    <p className="text-[10px] text-[#179cde] font-mono truncate">{user.email}</p>
                 </div>
                 <button onClick={() => startDirectMessage(user)} className="bg-[#179cde] text-white px-3 py-1.5 rounded-xl font-bold text-xs hover:bg-blue-600 transition-colors">Написать</button>
              </div>
            ))}
          </div>
        )}

        {localChats.length === 0 && globalChannels.length === 0 && globalUsers.length === 0 && (
          <p className="text-center text-slate-400 text-sm mt-4">Ничего не найдено</p>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#e4ebf5]">
      
      <div className="w-20 bg-[#1e293b] flex flex-col items-center py-6 space-y-8 z-20 shadow-2xl">
        <div className="w-10 h-10 bg-[#179cde] rounded-2xl flex items-center justify-center text-white shadow-lg mb-4">
           <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
        </div>
        <button onClick={() => { setActiveTab('chats'); setActiveForum(null); }} className={`p-3 rounded-2xl transition-all ${activeTab === 'chats' ? 'bg-[#179cde] text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}><IconChats /></button>
        <button onClick={() => setActiveTab('profile')} className={`p-3 rounded-2xl transition-all ${activeTab === 'profile' ? 'bg-[#179cde] text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}><IconProfile /></button>
      </div>

      <div className={`w-full md:w-80 bg-white/40 backdrop-blur-md border-r border-slate-200 flex flex-col relative z-10 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        
        {activeTab === 'chats' && (
          <>
            <div className="p-5 border-b border-slate-200">
              <h1 className="text-xl font-black text-slate-800 mb-4">Чаты</h1>
              <input type="text" placeholder="Поиск (Имя, Канал, ID)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-100 border-none px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#179cde] text-sm text-slate-700 shadow-inner" />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">{renderSidebarContent()}</div>
            <button onClick={openCreateChatModal} className="absolute bottom-6 right-6 w-14 h-14 bg-[#179cde] rounded-2xl text-white shadow-xl flex items-center justify-center text-2xl hover:scale-110 transition-all">+</button>
          </>
        )}

        {activeTab === 'profile' && (
          <div className="p-8 flex flex-col items-center animate-fade-in w-full overflow-y-auto">
            <div className="w-28 h-28 bg-gradient-to-tr from-[#179cde] to-[#60b6e6] rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black mb-6 shadow-2xl rotate-3">
              {currentUsername.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-6 w-full text-center">Настройки профиля</h2>
            <div className="w-full space-y-4">
               <div className="p-5 bg-white/60 rounded-2xl border border-slate-200">
                  <p className="text-xs uppercase font-black text-slate-400 mb-2">Изменить имя</p>
                  <div className="flex gap-2">
                    <input type="text" placeholder={currentUsername} value={newProfileName} onChange={e => setNewProfileName(e.target.value)} className="flex-1 bg-slate-100 px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-[#179cde]" />
                    <button onClick={handleUpdateProfile} className="bg-[#179cde] text-white px-4 py-2 rounded-xl font-bold">✓</button>
                  </div>
               </div>
               <div className="p-5 bg-white/60 rounded-2xl border border-slate-200">
                  <p className="text-xs uppercase font-black text-slate-400 mb-1">Ваш ID (Email)</p>
                  <p className="text-slate-700 font-mono text-sm">{currentEmail}</p>
               </div>
            </div>
            <div className="w-full mt-8 space-y-3">
              <button onClick={handleLogout} className="w-full py-4 bg-slate-200 text-slate-700 rounded-2xl font-black hover:bg-slate-300">ВЫЙТИ ИЗ АККАУНТА</button>
              <button onClick={handleDeleteProfile} className="w-full py-4 bg-red-50 text-red-500 rounded-2xl font-black hover:bg-red-500 hover:text-white">УДАЛИТЬ ПРОФИЛЬ НАВСЕГДА</button>
            </div>
          </div>
        )}
      </div>

      <div className={`flex-1 bg-slate-50 flex flex-col relative ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            <div className="h-20 bg-white/80 backdrop-blur-md px-6 flex justify-between items-center shadow-sm z-10 border-b border-slate-200">
              <div className="flex items-center cursor-pointer group flex-1" onClick={() => setShowChatInfo(true)}>
                <button onClick={(e) => { e.stopPropagation(); setActiveChat(null); }} className="md:hidden mr-4 text-[#179cde] font-bold text-2xl w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center">←</button>
                <div className="w-12 h-12 bg-gradient-to-tr from-[#179cde] to-[#60b6e6] text-white rounded-2xl flex items-center justify-center font-black mr-4 shadow-md group-hover:scale-105 transition-transform">{activeChat.title.charAt(0).toUpperCase()}</div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h2 className="font-black text-slate-800 leading-tight">{activeChat.title}</h2>
                    {activeChat.type === 'CHANNEL' && <span className="bg-orange-100 text-orange-600 text-[10px] px-2 py-0.5 rounded-full font-bold">КАНАЛ</span>}
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">{activeChat.members?.length || 0} участников</span>
                </div>
              </div>

              <button onClick={() => setShowChatMenu(!showChatMenu)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-xl font-black text-xl">⋮</button>

              {showChatMenu && (
                <div className="absolute right-6 top-20 w-56 bg-white shadow-2xl rounded-2xl py-3 z-50 border border-slate-100">
                  <button onClick={openRenameModal} className="w-full text-left px-5 py-2.5 hover:bg-slate-50 text-sm font-bold text-slate-700">✎ Изменить название</button>
                  <button onClick={openAddMemberModal} className="w-full text-left px-5 py-2.5 hover:bg-slate-50 text-sm font-bold text-slate-700">👤 Добавить участника</button>
                  {!activeChat.parentId && <button onClick={openSubChatModal} className="w-full text-left px-5 py-2.5 hover:bg-slate-50 text-sm font-bold text-slate-700">📂 Создать подчат</button>}
                  <div className="h-px bg-slate-100 my-2"></div>
                  <button onClick={openConfirmLeave} className="w-full text-left px-5 py-2.5 hover:bg-orange-50 text-sm font-bold text-orange-600">🚪 Выйти</button>
                  <button onClick={openConfirmDeleteChat} className="w-full text-left px-5 py-2.5 hover:bg-red-50 text-sm font-bold text-red-600">🗑 Удалить чат</button>
                </div>
              )}
            </div>

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8fafc] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] shadow-inner" onClick={() => setShowChatMenu(false)}>
              
              {hasMoreMessages && (
                <div className="flex justify-center mb-4">
                  <button onClick={loadMoreHistory} className="bg-white border border-slate-200 text-[#179cde] px-4 py-2 rounded-full font-bold text-sm shadow-sm hover:bg-blue-50">
                    Загрузить историю
                  </button>
                </div>
              )}

              {messages.map(msg => {
                const isMine = msg.sender === currentUsername;
                const isSelected = selectedMessageId === msg.id;

                const isImage = msg.fileUrl?.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                const isVideo = msg.fileUrl?.match(/\.(mp4|webm|mkv|mov)$/i);
                const isAudio = msg.fileUrl?.match(/\.(mp3|wav|ogg)$/i);
                const isDocument = msg.fileUrl && !isImage && !isVideo && !isAudio;
                const textContent = msg.content.startsWith('Файл: ') ? '' : msg.content;
                const fileName = msg.content.replace('Файл: ', '');

                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                    <div onClick={() => isMine && setSelectedMessageId(isSelected ? null : msg.id)} className={`relative max-w-[70%] min-w-[140px] px-4 py-3 rounded-3xl shadow-sm cursor-pointer transition-all ${isMine ? 'bg-[#179cde] text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'} ${isSelected ? 'ring-4 ring-blue-200' : ''}`}>
                      {!isMine && <span className="text-[10px] font-black uppercase text-[#179cde] mb-1 block">{msg.sender}</span>}
                      
                      {isImage && <div className="-mx-2 -mt-1 mb-2"><img src={`http://localhost:8080${msg.fileUrl}`} alt="attachment" className="w-full max-h-[300px] object-cover rounded-2xl hover:opacity-90" onClick={() => window.open(`http://localhost:8080${msg.fileUrl}`, '_blank')} /></div>}
                      {isVideo && <div className="-mx-2 -mt-1 mb-2"><video src={`http://localhost:8080${msg.fileUrl}`} controls className="w-full max-h-[300px] bg-black rounded-2xl" /></div>}
                      {isAudio && <div className="mb-2 mt-1"><audio src={`http://localhost:8080${msg.fileUrl}`} controls className="w-full h-10" /></div>}
                      {isDocument && (
                        <a href={`http://localhost:8080${msg.fileUrl}`} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 p-3 mb-2 rounded-2xl ${isMine ? 'bg-white/20 hover:bg-white/30' : 'bg-slate-100 hover:bg-slate-200'}`}>
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isMine ? 'text-white' : 'text-[#179cde]'}`}><IconDocument /></div>
                          <div className="flex flex-col min-w-0 pr-2"><span className="font-bold text-[14px] truncate">{fileName}</span><span className={`text-[10px] uppercase font-black ${isMine ? 'text-blue-100' : 'text-slate-400'}`}>Документ</span></div>
                        </a>
                      )}
                      {textContent && <p className="text-[15px] font-medium leading-relaxed break-words px-1">{textContent}</p>}
                      <div className={`text-[10px] text-right mt-1 font-bold px-1 ${isMine ? 'text-blue-100' : 'text-slate-400'}`}>{formatTime(msg.timestamp)}</div>
                      
                      {isMine && isSelected && (
                        <div className="absolute -top-12 right-0 bg-white shadow-2xl rounded-xl flex border border-slate-100 overflow-hidden z-10">
                          <button onClick={(e) => { e.stopPropagation(); startEditingMessage(msg); }} className="px-4 py-2 text-xs font-black hover:bg-slate-50 text-slate-700">ИЗМЕНИТЬ</button>
                          <button onClick={(e) => { e.stopPropagation(); openConfirmDeleteMessage(msg.id); }} className="px-4 py-2 text-xs font-black hover:bg-red-50 text-red-600 border-l border-slate-100">УДАЛИТЬ</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {!canWrite ? (
              <div className="p-5 bg-white border-t border-slate-200 text-center">
                <p className="text-slate-400 font-bold uppercase text-sm">Это канал. Только администраторы могут писать сюда.</p>
              </div>
            ) : (
              <div className="p-5 bg-white border-t border-slate-200">
                <form onSubmit={handleSendMessage} className="max-w-5xl mx-auto flex items-center gap-3">
                  <button type="button" onClick={() => fileInputRef.current.click()} className="p-3 text-slate-400 hover:text-[#179cde] hover:bg-blue-50 rounded-2xl"><IconAttach /></button>
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                  <div className="flex-1 relative">
                    {editingMessage && <div className="absolute -top-10 left-0 right-0 bg-blue-50 text-[#179cde] text-[10px] font-black px-4 py-1.5 rounded-t-xl flex justify-between"><span>РЕДАКТИРОВАНИЕ</span><button type="button" onClick={() => { setEditingMessage(null); setInputText(''); }}>✕</button></div>}
                    <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Написать сообщение..." className={`w-full bg-slate-100 border-none px-6 py-3.5 outline-none focus:ring-2 focus:ring-[#179cde] text-slate-700 font-medium ${editingMessage ? 'rounded-b-2xl rounded-t-none' : 'rounded-2xl'}`} />
                  </div>
                  <button type="submit" className="bg-[#179cde] text-white w-14 h-14 rounded-2xl font-black shadow-lg hover:scale-105">{editingMessage ? '✓' : '➤'}</button>
                </form>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
             <div className="w-24 h-24 text-slate-200 mb-4"><IconChats /></div><p className="text-slate-400 font-black uppercase tracking-widest text-sm">Выберите чат для общения</p>
          </div>
        )}
      </div>

      {modalConfig && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md animate-zoom-in">
            {['CREATE_CHAT', 'CREATE_SUBCHAT', 'RENAME_CHAT'].includes(modalConfig.type) && (
              <>
                <h2 className="text-2xl font-black mb-6 text-slate-800">{modalConfig.type === 'RENAME_CHAT' ? 'ПЕРЕИМЕНОВАТЬ' : 'СОЗДАТЬ'}</h2>
                <input type="text" placeholder="Название..." value={inputValue} onChange={e => setInputValue(e.target.value)} className="w-full bg-slate-100 border-none px-6 py-4 rounded-2xl mb-6 outline-none focus:ring-2 focus:ring-[#179cde] font-bold" autoFocus />
                
                {modalConfig.type === 'CREATE_CHAT' && (
                  <>
                    <h3 className="text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">Тип чата</h3>
                    <div className="flex gap-2 mb-6">
                      <button 
                        type="button"
                        onClick={() => setModalConfig({...modalConfig, chatType: 'GROUP'})}
                        className={`flex-1 p-3 rounded-2xl font-black border-2 transition-all ${modalConfig.chatType === 'GROUP' ? 'border-[#179cde] bg-[#179cde]/10 text-[#179cde]' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                      >
                        👥 Группа
                      </button>
                      <button 
                        type="button"
                        onClick={() => setModalConfig({...modalConfig, chatType: 'CHANNEL'})}
                        className={`flex-1 p-3 rounded-2xl font-black border-2 transition-all ${modalConfig.chatType === 'CHANNEL' ? 'border-orange-400 bg-orange-50 text-orange-500' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                      >
                        📢 Канал
                      </button>
                    </div>

                    <h3 className="text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">Участники</h3>
                    <div className="max-h-48 overflow-y-auto mb-6 space-y-2 p-2 bg-slate-50 rounded-2xl">
                      {allUsers.map(user => (
                        <label key={user.id} className="flex items-center p-3 hover:bg-white rounded-xl cursor-pointer shadow-sm">
                          <input type="checkbox" className="w-5 h-5 rounded-lg text-[#179cde] mr-3" checked={selectedUsers.includes(user.username)} onChange={() => setSelectedUsers(prev => prev.includes(user.username) ? prev.filter(u => u !== user.username) : [...prev, user.username])} />
                          <span className="font-bold text-slate-700">{user.username}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-4 rounded-2xl font-black text-slate-400 hover:bg-slate-100 transition-all">ОТМЕНА</button>
                  <button onClick={() => { modalConfig.type === 'CREATE_CHAT' ? executeCreateChat() : modalConfig.type === 'CREATE_SUBCHAT' ? executeCreateSubChat() : executeRename(); }} className="flex-1 py-4 bg-[#179cde] text-white rounded-2xl font-black shadow-lg">ГОТОВО</button>
                </div>
              </>
            )}

            {modalConfig.type === 'ADD_MEMBER' && (
              <>
                <h2 className="text-2xl font-black mb-6 text-slate-800">ДОБАВИТЬ ЛЮДЕЙ</h2>
                <div className="max-h-64 overflow-y-auto mb-6 space-y-2">
                  {allUsers.map(user => (
                    <label key={user.id} className="flex items-center p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-blue-50">
                      <input type="checkbox" className="w-5 h-5 rounded-lg text-[#179cde] mr-4" checked={selectedUsers.includes(user.username)} onChange={() => setSelectedUsers(prev => prev.includes(user.username) ? prev.filter(u => u !== user.username) : [...prev, user.username])} />
                      <span className="font-bold text-slate-700">{user.username}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-4 rounded-2xl font-black text-slate-400 hover:bg-slate-100">ОТМЕНА</button>
                  <button onClick={executeAddMembers} className="flex-1 py-4 bg-[#179cde] text-white rounded-2xl font-black shadow-lg">ДОБАВИТЬ</button>
                </div>
              </>
            )}

            {modalConfig.type === 'CONFIRM' && (
              <div className="text-center">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">!</div>
                <h2 className="text-2xl font-black mb-2 text-slate-800">{modalConfig.title}</h2>
                <p className="text-slate-500 font-medium mb-8">{modalConfig.message}</p>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-4 rounded-2xl font-black text-slate-400 hover:bg-slate-100">ОТМЕНА</button>
                  <button onClick={modalConfig.action} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black shadow-lg">ПОДТВЕРДИТЬ</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showChatInfo && activeChat && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4" onClick={() => setShowChatInfo(false)}>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md animate-zoom-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div className="w-20 h-20 bg-gradient-to-tr from-[#179cde] to-[#60b6e6] rounded-3xl text-white flex items-center justify-center text-3xl font-black shadow-lg">{activeChat.title.charAt(0).toUpperCase()}</div>
              <button onClick={() => setShowChatInfo(false)} className="text-slate-400 hover:text-slate-800 text-2xl font-bold bg-slate-100 w-10 h-10 rounded-full">✕</button>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-1">{activeChat.title}</h2>
            <p className="text-sm font-medium text-slate-400 mb-6">Создан: {new Date(activeChat.createdAt).toLocaleDateString()}</p>
            
            <h3 className="font-black text-[#179cde] mb-4 text-sm uppercase tracking-wider">Участники ({activeChat.members?.length})</h3>
            <div className="max-h-56 overflow-y-auto space-y-2 pr-2">
              {activeChat.members?.map(user => (
                <div key={user.id} className="flex items-center p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-[#179cde]/20 text-[#179cde] flex items-center justify-center font-black mr-4 shadow-sm">{user.username.charAt(0).toUpperCase()}</div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700 flex items-center">
                      {user.username} 
                      {user.username === currentUsername && <span className="text-[10px] text-[#179cde] bg-blue-100 px-2 py-0.5 rounded-lg ml-2">ВЫ</span>}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}