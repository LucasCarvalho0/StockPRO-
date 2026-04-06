'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services';
import { Loader2 } from 'lucide-react';

const schema = z.object({ matricula: z.string().min(1, 'Obrigatório'), senha: z.string().min(6, 'Mínimo 6 caracteres') });
type Form = z.infer<typeof schema>;

const features = ['Gestão de entradas e saídas em tempo real','Alertas automáticos de estoque mínimo','Inventário semanal com auditoria completa','Relatórios PDF e Excel automatizados'];

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated, _hasHydrated } = useAuthStore();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  // Se já estiver autenticado após a hidratação, pula o login
  useState(() => {
    if (typeof window !== 'undefined' && _hasHydrated && isAuthenticated) {
      router.push('/dashboard');
    }
  });

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  const onSubmit = async (data: Form) => {
    setError('');
    try {
      const res = await authService.login(data.matricula, data.senha);
      setAuth(res.user, res.access_token);
      router.push('/dashboard');
    } catch (err: any) { setError(err?.response?.data?.message ?? 'Matrícula ou senha inválidos'); }
  };

  const inputStyle = { background: '#1a3460', border: '1px solid rgba(255,255,255,0.1)' };

  return (
    <div className="min-h-screen flex" style={{ background: '#0a1628' }}>
      {/* Painel esquerdo */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-12" style={{ background: '#0f2040', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#2563eb' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M20 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zm-9 8H7v-2h4v2zm6 0h-4v-2h4v2zM4 7V5a2 2 0 012-2h12a2 2 0 012 2v2H4z" /></svg>
            </div>
            <div>
              <p className="text-white font-bold text-lg font-display">StockPRO</p>
              <p className="text-[10px] tracking-widest uppercase font-mono-custom" style={{ color: 'rgba(255,255,255,0.35)' }}>Estoque Corporativo</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight font-display">Controle total do seu estoque empresarial</h2>
          <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>Sistema profissional com rastreabilidade completa, alertas inteligentes e relatórios automatizados.</p>
        </div>
        <div className="space-y-3">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-3 text-[13px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />{f}
            </div>
          ))}
        </div>
      </div>

      {/* Formulário */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-white mb-1 font-display">Acesso ao Sistema</h1>
          <p className="text-[13px] mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>Use sua matrícula e senha corporativa</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider font-mono-custom" style={{ color: 'rgba(255,255,255,0.4)' }}>Matrícula</label>
              <input {...register('matricula')} placeholder="Ex: 4821" className="w-full px-4 py-2.5 rounded-lg text-sm outline-none text-white placeholder-slate-500 transition-colors" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#2563eb')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
              {errors.matricula && <p className="text-red-400 text-[11px] mt-1">{errors.matricula.message}</p>}
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider font-mono-custom" style={{ color: 'rgba(255,255,255,0.4)' }}>Senha</label>
              <input {...register('senha')} type="password" placeholder="••••••••" className="w-full px-4 py-2.5 rounded-lg text-sm outline-none text-white placeholder-slate-500 transition-colors" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#2563eb')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
              {errors.senha && <p className="text-red-400 text-[11px] mt-1">{errors.senha.message}</p>}
            </div>
            {error && <div className="px-4 py-3 rounded-lg text-[12px] text-red-400" style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)' }}>{error}</div>}
            <button type="submit" disabled={isSubmitting} className="w-full py-2.5 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2" style={{ background: '#2563eb' }}>
              {isSubmitting ? <><Loader2 size={14} className="animate-spin" />Entrando...</> : 'Entrar no Sistema'}
            </button>
          </form>
          <p className="text-center text-[11px] mt-8 font-mono-custom" style={{ color: 'rgba(255,255,255,0.2)' }}>StockPRO · Acesso restrito a usuários autorizados</p>
        </div>
      </div>
    </div>
  );
}
