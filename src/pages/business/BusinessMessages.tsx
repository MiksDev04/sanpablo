import { useAuth } from '../../contexts/AuthContext';
import { dummyMessages } from '../../data/dummyData';
import { MessageSquare, Mail } from 'lucide-react';

export default function BusinessMessages() {
  const { user } = useAuth();
  const userId = user?.id ?? 'user-2';

  const messages = dummyMessages
    .filter((m) => m.receiverId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gov-blue mb-6">Messages</h1>
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No messages yet.</p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`p-4 rounded-lg border ${
                m.readStatus ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gov-blue/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="text-gov-blue" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gov-blue">{m.subject}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {new Date(m.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    {!m.readStatus && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">New</span>
                    )}
                  </p>
                  <p className="text-gray-600 mt-2">{m.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
