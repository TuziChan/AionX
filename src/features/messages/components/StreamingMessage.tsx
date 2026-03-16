interface Props {
  content: string;
}

export function StreamingMessage({ content }: Props) {
  return (
    <div className="flex justify-start">
      <div className="chat-bubble chat-bubble--assistant">
        {content}
        <span className="inline-block w-2 h-4 ml-0.5 bg-brand animate-pulse rounded-sm" />
      </div>
    </div>
  );
}
