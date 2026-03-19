import { ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles, Workflow } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FormPageFrame } from '@/app/layouts';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input, Label, PageHeader, PageSection, Separator } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import { AppLogoMark } from '@/widgets/app-frame';

export function Component() {
  const navigate = useNavigate();
  const location = useLocation();
  const status = useAuthStore((state) => state.status);
  const login = useAuthStore((state) => state.login);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const targetPath = useMemo(() => {
    return (location.state as { from?: string } | null)?.from || '/guid';
  }, [location.state]);

  useEffect(() => {
    if (status === 'authenticated') {
      navigate(targetPath, { replace: true });
    }
  }, [navigate, status, targetPath]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const result = await login({
      username,
      password,
      remember: rememberMe,
    });

    setSubmitting(false);

    if (!result.success) {
      setMessage({
        type: 'error',
        text: result.message || '登录失败，请检查输入。',
      });
      return;
    }

    setMessage({
      type: 'success',
      text: '已登录，正在进入工作区。',
    });
    navigate(targetPath, { replace: true });
  };

  return (
    <FormPageFrame contentClassName="max-w-[480px]">
      <PageSection
        tone="elevated"
        className="border-white/55 bg-white/88 text-slate-950 shadow-[var(--shadow-lg)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/82 dark:text-slate-50"
      >
        <div className="flex flex-col gap-8">
          <div className="flex justify-center">
            <AppLogoMark size="lg" className="shadow-[0_16px_40px_rgba(37,99,235,0.22)]" />
          </div>

          <PageHeader
            align="center"
            eyebrow="Workspace Access"
            title="进入 AionX 工作台"
            description="新的统一设计系统入口已经就位。登录后会继续进入 Guide、Conversation、Settings 与 Cron 的同一套 shared shell。"
          />

          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="username" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                用户名
              </Label>
              <Input
                id="username"
                className="h-11 rounded-[16px] border-slate-200/90 bg-white/72 px-4 text-[15px] shadow-none dark:border-slate-700 dark:bg-slate-900/70"
                placeholder="victory"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                密码
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={passwordVisible ? 'text' : 'password'}
                  className="h-11 rounded-[16px] border-slate-200/90 bg-white/72 px-4 pr-14 text-[15px] shadow-none dark:border-slate-700 dark:bg-slate-900/70"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1.5 top-1.5 h-8 rounded-xl px-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  onClick={() => setPasswordVisible((prev) => !prev)}
                >
                  {passwordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  <span className="sr-only">{passwordVisible ? '隐藏密码' : '显示密码'}</span>
                </Button>
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/75 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/65 dark:text-slate-300">
              <input
                type="checkbox"
                id="remember-me"
                className="size-4 rounded border-slate-300 text-primary focus:ring-primary"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>记住登录状态</span>
            </label>

            <Button type="submit" size="lg" className="h-11 w-full rounded-[16px]" disabled={submitting}>
              <span>{submitting ? '登录中…' : '进入 AionX'}</span>
              <ArrowRight className="size-4" />
            </Button>

            <div
              role="alert"
              aria-live="polite"
              className={cn(
                'rounded-2xl border px-4 py-3 text-sm leading-6',
                message ? 'block' : 'hidden',
                message?.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'border-red-200 bg-red-50 text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'
              )}
              hidden={!message}
            >
              {message?.text}
            </div>
          </form>

          <Separator className="bg-slate-200/80 dark:bg-slate-800" />

          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100/80 px-3 py-1.5 dark:bg-slate-900/70">
              <ShieldCheck className="size-4" />
              Screenshot-ready Shell
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100/80 px-3 py-1.5 dark:bg-slate-900/70">
              <Workflow className="size-4" />
              Guide / Conversation / Settings
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100/80 px-3 py-1.5 dark:bg-slate-900/70">
              <Sparkles className="size-4" />
              Cron / Tools / About
            </span>
          </div>
        </div>
      </PageSection>
    </FormPageFrame>
  );
}

Component.displayName = 'LoginPage';
