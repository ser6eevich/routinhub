'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Download, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Video, 
  FileText, 
  List, 
  Send, 
  Hash,
  Copy,
  Check,
  Sparkles,
  Image
} from 'lucide-react';
import { Job } from '@/lib/types';

export default function ProjectPage() {
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    let pollInterval: NodeJS.Timeout;

    const fetchJob = async () => {
      if (!isMounted) return;
      try {
        const res = await fetch(`/api/webinars/${id}`);
        if (!res.ok) throw new Error('Проект не найден');
        const data = await res.json();
        
        if (isMounted) {
          setJob(data);
          setLoading(false);
          if (data.status !== 'done' && data.status !== 'error') {
            pollInterval = setTimeout(fetchJob, 15000); // 15s poll
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchJob();
    return () => { 
      isMounted = false;
      if (pollInterval) clearTimeout(pollInterval); 
    };
  }, [id]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-[4px] border-indigo-100 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-text-muted font-black uppercase tracking-[0.2em] text-[10px]">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6">
        <div className="bg-bg-secondary border border-border p-8 rounded-[32px] max-w-sm w-full text-center space-y-6 shadow-luxe">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-[20px] flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight italic">Ошибка</h1>
            <p className="text-text-muted text-sm font-medium leading-relaxed">{error || 'Проект не найден'}</p>
          </div>
          <Link href="/webinars" className="flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white text-xs font-black rounded-xl transition-all hover:bg-indigo-700 uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" /> В дашборд
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header - Compact */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in border-b border-border/50 pb-8">
            <div className="space-y-4">
               <div className="flex gap-2">
                   <Link href="/webinars" className="px-4 py-2 bg-bg-secondary border border-border hover:border-indigo-100 dark:hover:border-indigo-900 rounded-xl text-text-muted hover:text-indigo-600 dark:hover:text-indigo-400 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2">
                    <ArrowLeft className="w-3.5 h-3.5" /> Назад
                   </Link>
                   <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${
                     job.status === 'done' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' : 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800'
                   }`}>
                    {job.status === 'done' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3 animate-spin" />}
                    {job.status === 'done' ? 'Готово' : 
                     job.status === 'downloading' ? 'Скачивание' :
                     job.status === 'rendering' ? 'Рендеринг' :
                     job.status === 'transcribing' ? 'Текст' :
                     job.status === 'analyzing' ? 'Анализ' : 'Загрузка'}
                   </span>
               </div>
               <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tighter italic bg-gradient-to-b from-indigo-600 to-slate-900 dark:from-indigo-400 dark:to-slate-200 bg-clip-text text-transparent pr-4">
                {job.projectTitle || job.title || 'Разбор вебинара'}
               </h1>
               <div className="flex items-center gap-4 text-text-muted font-bold uppercase tracking-widest text-[10px]">
                 <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(job.createdAt).toLocaleString('ru-RU')}</span>
                 <span className="bg-border/30 h-3 w-[1px]"></span>
                 <span className="flex items-center gap-1.5"><Video className="w-3 h-3" /> 1080p HD</span>
               </div>
            </div>
            
            <div className="flex gap-3">
                {job.status === 'done' && (
                  <div className="flex gap-2">
                    <a 
                      href={job.renderedUrl} 
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-xl transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-2 uppercase tracking-widest"
                    >
                      <Download className="w-4 h-4" /> Скачать MP4
                    </a>
                    {job.psdUrl && (
                      <a 
                        href={job.psdUrl} 
                        className="px-6 py-3 bg-bg-secondary border border-border hover:border-indigo-500/30 text-text-primary text-[10px] font-black rounded-xl transition-all shadow-sm flex items-center gap-2 uppercase tracking-widest"
                      >
                        <FileText className="w-4 h-4 text-indigo-500" /> Скачать PSD
                      </a>
                    )}
                    {job.coverUrl && (
                      <a 
                        href={job.coverUrl} 
                        download={`cover_${job.id}.png`}
                        className="px-6 py-3 bg-bg-secondary border border-border hover:border-emerald-500/30 text-text-primary text-[10px] font-black rounded-xl transition-all shadow-sm flex items-center gap-2 uppercase tracking-widest"
                      >
                        <Image className="w-4 h-4 text-emerald-500" /> Скачать PNG
                      </a>
                    )}
                  </div>
                )}
                <button 
                    onClick={async () => {
                        if (!confirm('Удалить проект?')) return;
                        const res = await fetch(`/api/webinars/${job.id}`, { method: 'DELETE' });
                        if (res.ok) router.push('/webinars');
                    }}
                    className="p-3 bg-bg-secondary hover:bg-rose-50 dark:hover:bg-rose-900/20 text-text-muted hover:text-rose-500 border border-border rounded-xl transition-all"
                    title="Удалить"
                >
                    <Trash2 className="w-4.5 h-4.5" />
                </button>
            </div>
        </div>

        {/* Processing - Compact */}
        {(job.status !== 'done' && job.status !== 'error') && (
            <div className="p-10 md:p-16 bg-bg-secondary rounded-[32px] border border-border text-center space-y-6 shadow-luxe transition-all duration-300">
                <div className="w-20 h-20 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-[24px] flex items-center justify-center text-indigo-600 dark:text-indigo-400 animate-pulse mx-auto border border-indigo-100 dark:border-indigo-800">
                   {job.status === 'downloading' ? <Download className="w-8 h-8" /> :
                    job.status === 'rendering' ? <Video className="w-8 h-8" /> : 
                    job.status === 'transcribing' ? <FileText className="w-8 h-8" /> :
                    <Sparkles className="w-8 h-8" />}
                </div>
                <div className="max-w-md mx-auto space-y-6">
                   <h3 className="text-2xl font-black tracking-tight uppercase tracking-tighter italic">
                        {job.status === 'downloading' ? 'Скачивание...' :
                         job.status === 'rendering' ? 'Рендеринг...' : 
                         job.status === 'transcribing' ? 'Текст...' :
                         job.status === 'analyzing' ? 'Анализ...' : 'Загрузка...'}
                   </h3>
                   
                   <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-text-muted px-1">
                        <span>Прогресс</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{job.progress || 0}%</span>
                      </div>
                      <div className="h-3 bg-bg-primary rounded-full overflow-hidden border border-border p-0.5">
                        <div 
                          className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-700 shadow-lg shadow-indigo-500/30"
                          style={{ width: `${job.progress || 0}%` }}
                        ></div>
                      </div>
                   </div>

                   <p className="text-text-muted text-[13px] leading-relaxed font-medium">
                     Это займет от 2 до 10 минут. Мы уведомим вас о готовности.
                   </p>
                </div>
            </div>
        )}

        {/* Results - Compact Grid */}
        {job.status === 'done' && (
          <div className="space-y-10 animate-fade-in transition-all">
            {/* Player */}
            <div className="bg-slate-950 dark:bg-black rounded-[32px] overflow-hidden shadow-2xl ring-1 ring-white/5 relative group border border-border/10">
              <div className="aspect-video flex items-center justify-center">
                 <video 
                   src={job.renderedUrl} 
                   controls 
                   className="max-h-full max-w-full"
                 />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
              
              {/* Title & Description */}
              <div className="bg-bg-secondary rounded-[28px] border border-border p-6 space-y-6 shadow-sm">
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                        <FileText className="w-4 h-4" />
                        <h3 className="font-black text-[10px] uppercase tracking-[0.2em]">Заголовок</h3>
                      </div>
                      <button onClick={() => copyToClipboard(job.title || '', 'title')} className="p-2 text-text-muted hover:text-indigo-600 transition-colors">
                        {copied === 'title' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xl font-black leading-tight tracking-tight text-text-primary">{job.title || '—'}</p>
                 </div>
                 
                 <div className="pt-6 border-t border-border/50 space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                        <List className="w-4 h-4" />
                        <h3 className="font-black text-[10px] uppercase tracking-[0.2em]">Краткий разбор</h3>
                      </div>
                      <button onClick={() => copyToClipboard(job.description || '', 'desc')} className="p-2 text-text-muted hover:text-indigo-600 transition-colors">
                        {copied === 'desc' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-text-secondary leading-relaxed font-medium text-sm whitespace-pre-wrap">{job.description || '—'}</p>
                 </div>
              </div>

              {/* Timecodes */}
              <div className="bg-bg-secondary rounded-[28px] border border-border p-6 flex flex-col shadow-sm">
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                        <Clock className="w-4 h-4" />
                        <h3 className="font-black text-[10px] uppercase tracking-[0.2em]">Тайм-коды</h3>
                    </div>
                    <button onClick={() => copyToClipboard(job.timecodes || '', 'time')} className="p-2 text-text-muted hover:text-indigo-600 transition-colors">
                       {copied === 'time' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                 </div>
                 <div className="bg-bg-primary/50 rounded-2xl p-6 flex-1 font-mono text-[13px] leading-relaxed text-text-secondary border border-border whitespace-pre-wrap">
                    {job.timecodes || 'Обработка...'}
                 </div>
              </div>

              {/* Telegram Post */}
              <div className="bg-bg-secondary rounded-[28px] border border-border p-8 md:col-span-2 space-y-8 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-indigo-600 pointer-events-none">
                    <Send className="w-48 h-48 -rotate-12" />
                 </div>
                 
                 <div className="flex items-center justify-between relative">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                        <Send className="w-4 h-4" />
                        <h3 className="font-black text-[10px] uppercase tracking-[0.2em]">Пост для Telegram</h3>
                    </div>
                    <button onClick={() => copyToClipboard(job.postDescription || '', 'post')} className="p-2 text-text-muted hover:text-indigo-600 transition-colors">
                       {copied === 'post' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                 </div>
                 
                 <div className="bg-bg-primary/80 backdrop-blur-sm rounded-2xl p-6 leading-relaxed text-text-primary border border-border text-base font-medium whitespace-pre-wrap relative italic">
                    {job.postDescription || 'В процессе...'}
                 </div>
                 
                 {job.tags && job.tags.length > 0 && (
                   <div className="flex flex-wrap gap-2 relative">
                      {job.tags.map(tag => (
                        <div key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50/50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded-full shadow-sm">
                          <Hash className="w-3 h-3" />
                          {tag.replace('#', '')}
                        </div>
                      ))}
                   </div>
                 )}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
