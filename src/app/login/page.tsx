'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.replace('/');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || '登录失败');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f4f2ec' }}>
      <form
        onSubmit={submit}
        className="source-card w-full max-w-sm rounded-2xl p-8 flex flex-col gap-4"
        style={{ border: '1px solid #d9d3cb' }}
      >
        <div className="text-center mb-2">
          <span className="text-3xl block mb-2">🔐</span>
          <h1 className="text-lg font-bold" style={{ color: '#1c1814' }}>管理员登录</h1>
          <p className="text-xs mt-1" style={{ color: '#6e6a63' }}>登录后可编辑、导入、删除和排序语料</p>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold" style={{ color: '#6e6a63' }}>用户名</span>
          <input className="edit-input" autoComplete="username" autoFocus value={username} onChange={e => setUsername(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold" style={{ color: '#6e6a63' }}>密码</span>
          <input className="edit-input" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        {error && <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>}
        <button type="submit" className="btn-save py-2 flex justify-center text-center" disabled={loading}>
          {loading ? '登录中…' : '登录'}
        </button>
        <Link href="/" className="text-xs text-center" style={{ color: '#6e6a63' }}>← 返回笔记本</Link>
      </form>
    </div>
  );
}
