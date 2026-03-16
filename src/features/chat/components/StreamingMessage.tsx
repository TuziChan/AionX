interface Props {
  content: string;
}

export function StreamingMessage({ content }: Props) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-xl px-4 py-3 bg-bg-2 text-t-primary text-sm leading-relaxed whitespace-pre-wrap break-words">
        {content}
        <span className="inline-block w-2 h-4 ml-0.5 bg-brand animate-pulse rounded-sm" />
      </div>
    </div>
  );
}
