import axios from 'axios';

const api = axios.create({
    baseURL: 'https://messenger-xmx7.onrender.com/api',
    headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);

export const getUsers = () => api.get('/users');
export const updateUsername = (userId, newUsername) => api.put(`/users/${userId}?newUsername=${encodeURIComponent(newUsername)}`);
export const deleteUser = (userId) => api.delete(`/users/${userId}`);

export const getChats = () => api.get('/chats');
export const createChat = (title, usernames, parentId = null, chatType = 'GROUP') => {
    const params = new URLSearchParams();
    params.append('title', title);
    usernames.forEach(name => params.append('usernames', name));
    if (parentId) params.append('parentId', parentId);
    params.append('type', chatType);
    return api.post(`/chats?${params.toString()}`);
};
export const updateChatTitle = (chatId, newTitle) => api.put(`/chats/${chatId}?newTitle=${encodeURIComponent(newTitle)}`);
export const addChatMember = (chatId, username) => api.put(`/chats/${chatId}/members?username=${encodeURIComponent(username)}`);
export const removeChatMember = (chatId, username) => api.delete(`/chats/${chatId}/members?username=${encodeURIComponent(username)}`);
export const deleteChat = (chatId) => api.delete(`/chats/${chatId}`);

export const getMessagesPaged = (chatId, page = 0, size = 30) => api.get(`/messages?chatId=${chatId}&page=${page}&size=${size}`);
export const sendMessage = (messageData) => api.post('/messages', messageData);
export const updateMessage = (messageId, newContent) => api.put(`/messages/${messageId}?newContent=${encodeURIComponent(newContent)}`);
export const deleteMessage = (messageId) => api.delete(`/messages/${messageId}`);

export const uploadFile = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export default api;