'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CloudUpload, 
  Plus, 
  Video as Youtube, 
  FileVideo, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  History,
  LayoutGrid,
  Link2
} from 'lucide-react';
import { Job } from '@/lib/types';

export default function WebinarsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [coverDate, setCoverDate] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [mode, setMode] = useState<'file' | 'url'>('file');

  useEffect(() => {
    let isMounted = true;
    let timerId: NodeJS.Timeout;

    const pollWithCheck = async () => {
      if (!isMounted) return;
      try {
        const res = await fetch('/api/webinars/jobs');
        if (res.ok) {
          const data: Job[] = await res.json();
          if (isMounted) {
            setJobs(data);
            const active = data.some(j => j.status !== 'done' && j.status !== 'error');
            // Very long poll when idle, 10s when active
            timerId = setTimeout(pollWithCheck, active ? 10000 : 60000);
          }
        }
      } catch (e) {
        if (isMounted) timerId = setTimeout(pollWithCheck, 60000);
      }
    };

    fetchJobs(); // Initial fetch
    timerId = setTimeout(pollWithCheck, 15000); // Start cycle
    return () => { 
      isMounted = false;
      if (timerId) clearTimeout(timerId); 
    };
  }, []);

  const fetchJobs = async () => {
    const res = await fetch('/api/webinars/jobs');
    const data = await res.json();
    setJobs(data);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'file' && !file) return;
    if (mode === 'url' && !url) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('projectTitle', projectTitle || (mode === 'file' ? file?.name || 'Без названия' : 'Видео по ссылке'));
    formData.append('coverDate', coverDate || new Date().toLocaleDateString('ru-RU'));
    if (mode === 'file' && file) formData.append('file', file);
    if (mode === 'url') formData.append('videoUrl', url);

    try {
      const res = await fetch('/api/webinars/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const { jobId } = await res.json();
        setFile(null);
        setUrl('');
        setProjectTitle('');
        setCoverDate('');
        fetchJobs();

        // Trigger processing automatically
        fetch('/api/webinars/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId }),
        }).catch(err => console.error('Processing trigger failed:', err));
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteJob = async (id: string) => {
    if (!confirm('Удалить проект?')) return;
    await fetch(`/api/webinars/${id}`, { method: 'DELETE' });
    fetchJobs();
  };

  return (
    <div className="min-h-screen bg-bg-primary p-4 md:p-8 space-y-8 animate-fade-in transition-colors duration-300">
      
      {/* Header Section - Compact */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/50">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-[9px] uppercase tracking-[0.2em]">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Workflow</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tighter italic bg-gradient-to-b from-indigo-600 to-slate-900 dark:from-indigo-400 dark:to-slate-200 bg-clip-text text-transparent">
            Вебинары
          </h1>
          <p className="text-text-muted text-sm font-medium">Создавайте контент из ваших видео за считанные минуты.</p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Creation Tool */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-6">
          <form onSubmit={handleUpload} className="bg-bg-secondary rounded-[28px] border border-border p-6 shadow-luxe space-y-5 transition-all duration-300">
            
            <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1 flex items-center gap-2">
                  <LayoutGrid className="w-3 h-3" /> Тип источника
                </label>
                <div className="bg-bg-primary p-1 rounded-xl border border-border flex shadow-sm scale-90 origin-right">
                    <button 
                      type="button"
                      onClick={() => setMode('file')}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'file' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-text-muted hover:text-text-primary'}`}
                    >
                      Файл
                    </button>
                    <button 
                      type="button"
                      onClick={() => setMode('url')}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'url' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-text-muted hover:text-text-primary'}`}
                    >
                      URL
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1 flex items-center gap-2">
                  <ArrowRight className="w-3 h-3" /> Название проекта
                </label>
                <input 
                  type="text" 
                  placeholder="Как назовем выпуск?"
                  className="w-full bg-input-bg border-2 border-border/50 focus:border-indigo-500 text-text-primary rounded-xl px-4 py-3 text-sm font-bold transition-all outline-none"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1 flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Дата для обложки
                </label>
                <input 
                  type="text" 
                  placeholder={new Date().toLocaleDateString('ru-RU')}
                  className="w-full bg-input-bg border-2 border-border/50 focus:border-indigo-500 text-text-primary rounded-xl px-4 py-3 text-sm font-bold transition-all outline-none"
                  value={coverDate}
                  onChange={(e) => setCoverDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">
                {mode === 'file' ? 'Видео файл' : 'Ссылка на видео'}
              </label>
              
              {mode === 'file' ? (
                <div 
                  className={`relative border-2 border-dashed rounded-[24px] p-8 transition-all flex flex-col items-center justify-center gap-4 group cursor-pointer ${file ? 'border-emerald-500 bg-emerald-50/10' : 'border-border hover:border-indigo-400 bg-input-bg'}`}
                  onClick={() => document.getElementById('fileInput')?.click()}
                >
                  <input id="fileInput" type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${file ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 group-hover:scale-110 shadow-sm'}`}>
                    {file ? <CheckCircle2 className="w-6 h-6" /> : <CloudUpload className="w-6 h-6" />}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-text-primary">{file ? file.name : 'Выберите файл'}</p>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-tight mt-1">MP4, MOV до 2GB</p>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
                    <Link2 className="w-5 h-5" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Вставьте ссылку (Я.Диск, прямая и др.)"
                    className="w-full bg-input-bg border-2 border-border/50 focus:border-indigo-500 text-text-primary rounded-xl px-12 py-4 text-sm font-bold transition-all outline-none"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
              )}
            </div>

            <button 
              disabled={isUploading}
              className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${isUploading ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20'}`}
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {isUploading ? 'Загрузка...' : 'Запустить процесс'}
            </button>
          </form>

          <div className="bg-bg-secondary rounded-[28px] border border-border p-6 shadow-sm space-y-4">
             <div className="flex items-center gap-2 text-indigo-600 font-black text-[9px] uppercase tracking-[0.2em]">
                <LayoutGrid className="w-4 h-4" />
                <span>Быстрый запуск</span>
             </div>
             <p className="text-text-muted text-[11px] leading-relaxed font-medium">Система автоматически проведет рендеринг, извлечет текст, проанализирует контент и подготовит посты для соцсетей.</p>
          </div>
        </div>

        {/* History Section */}
        <div className="lg:col-span-7 space-y-6">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3 text-text-primary">
                <History className="w-5 h-5" />
                <h2 className="text-xl font-black tracking-tight italic">Недавние проекты</h2>
              </div>
              <span className="bg-bg-secondary border border-border px-3 py-1 rounded-full text-[10px] font-black text-text-muted uppercase tracking-widest">
                {jobs.length} Всего
              </span>
           </div>

           {jobs.length === 0 ? (
             <div className="py-20 bg-bg-secondary rounded-[32px] border border-dashed border-border flex flex-col items-center justify-center text-center space-y-4 opacity-60">
                <div className="w-16 h-16 bg-bg-primary rounded-2xl flex items-center justify-center text-text-muted">
                    <FileVideo className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-text-muted uppercase tracking-widest">Список пуст</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map(job => (
                  <ResultCard key={job.id} job={job} onDelete={deleteJob} />
                ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

function ResultCard({ job, onDelete }: { job: Job; onDelete: (id: string) => void }) {
  const statusColors = {
    uploading: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800',
    downloading: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800',
    rendering: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800',
    transcribing: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800',
    analyzing: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800',
    done: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    error: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
  };

  const getStatusLabel = () => {
    switch (job.status) {
      case 'uploading': return 'Загрузка';
      case 'downloading': return `Скачивание ${job.progress ? `${job.progress}%` : ''}`;
      case 'rendering': return `Рендеринг ${job.progress ? `${job.progress}%` : ''}`;
      case 'transcribing': return 'Транскрибация';
      case 'analyzing': return 'Анализ контента';
      case 'done': return 'Готово';
      case 'error': return 'Ошибка';
      default: return 'В обработке';
    }
  };

  return (
    <div className="group relative transition-all duration-300">
      <Link href={`/webinars/${job.id}`} className="block">
        <div className="bg-bg-secondary border border-border p-5 rounded-[24px] hover:shadow-luxe hover:border-indigo-500/30 dark:hover:border-indigo-400/50 transition-all space-y-4 h-full text-left">
          <div className="aspect-video bg-bg-primary rounded-xl overflow-hidden border border-border relative flex items-center justify-center">
            {job.coverUrl ? (
                <img src={job.coverUrl} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt="Cover" />
            ) : job.status === 'done' ? (
                <video src={job.renderedUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            ) : (
                <div className="text-indigo-600/30 dark:text-indigo-400/20">
                    <FileVideo className="w-10 h-10" />
                </div>
            )}
            <div className="absolute bottom-3 left-3 flex gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border backdrop-blur-md shadow-lg ${statusColors[job.status] || ''}`}>
                    {job.status === 'done' ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> : <Clock className="w-3 h-3 inline mr-1 animate-spin" />}
                    {getStatusLabel()}
                </span>
            </div>
          </div>
          
          <div className="space-y-1 px-1">
             <h3 className="text-[13px] font-black tracking-tight text-text-primary group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                {job.projectTitle || job.title || 'Разбор вебинара'}
             </h3>
             <div className="flex items-center justify-between text-[9px] font-bold text-text-muted uppercase tracking-widest">
               <span>{new Date(job.createdAt).toLocaleDateString('ru-RU')}</span>
               <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-indigo-600 dark:text-indigo-400" />
             </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
