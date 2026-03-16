import { useParams } from 'react-router-dom';

export function Component() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="h-full flex flex-col items-center justify-center bg-base">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-t-primary mb-4">Chat Page</h1>
        <p className="text-lg text-t-secondary">
          Conversation ID: {id}
        </p>
      </div>
    </div>
  );
}

Component.displayName = 'ChatPage';
