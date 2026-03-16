export function Component() {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-base">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-t-primary mb-4">Welcome to AionX</h1>
        <p className="text-lg text-t-secondary">
          Start a conversation with your AI assistant
        </p>
      </div>
    </div>
  );
}

Component.displayName = 'GuidePage';
