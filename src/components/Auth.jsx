import React, { useState } from 'react';
import { login, register } from '../api/axiosConfig';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(''); 
    setIsLoading(true);

    try {
      let res;
      if (isLogin) {
        res = await login({ email, password });
      } else {
        res = await register({ email, username, password });
      }

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data.id);
      localStorage.setItem('username', res.data.username);
      localStorage.setItem('email', res.data.email);
      window.location.href = '/';
      
    } catch (err) {
      const errorData = err.response?.data;
      let errorMessage = 'Ошибка авторизации. Проверьте почту и пароль.';

      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData && errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData && errorData.error) {
        errorMessage = "Доступ запрещен: " + errorData.error;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e4ebf5]">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md animate-fade-in-up">
        <div className="w-20 h-20 bg-gradient-to-tr from-[#179cde] to-[#60b6e6] rounded-3xl mx-auto flex items-center justify-center text-white mb-8 shadow-lg">
          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
        </div>
        
        <h2 className="text-3xl font-black text-center text-slate-800 mb-8">{isLogin ? 'ВХОД' : 'РЕГИСТРАЦИЯ'}</h2>
        
        {/* Вывод ошибки */}
        {error && <div className="bg-red-50 text-red-500 p-4 rounded-2xl mb-6 font-bold text-sm text-center border border-red-100">{error}</div>}
        
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <input type="text" placeholder="Имя пользователя" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-slate-50 px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-[#179cde] font-bold text-slate-700 placeholder-slate-400" required />
          )}
          <input type="email" placeholder="Email адрес" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-[#179cde] font-bold text-slate-700 placeholder-slate-400" required />
          <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-[#179cde] font-bold text-slate-700 placeholder-slate-400" required />
          
          <button type="submit" disabled={isLoading} className="w-full bg-[#179cde] text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-200 hover:scale-[1.02] transition-transform disabled:opacity-50 mt-4">
            {isLoading ? 'ОЖИДАНИЕ...' : isLogin ? 'ВОЙТИ' : 'СОЗДАТЬ АККАУНТ'}
          </button>
        </form>
        
        <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }} className="w-full text-center mt-6 text-slate-400 font-bold hover:text-[#179cde] text-sm transition-colors">
          {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </button>
      </div>
    </div>
  );
}