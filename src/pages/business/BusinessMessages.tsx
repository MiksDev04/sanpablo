import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { MessageSquare, Mail, Eye, X } from 'lucide-react';

export default function BusinessMessages() {
  const { user } = useAuth();
  const userId = user?.id ?? 'user-2';
  const { messages: allMessages } = useData();
  const [viewMsg, setViewMsg] = useState<(typeof allMessages)[0] | null>(null);

  const messages = allMessages
    .filter((m) => m.receiverId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getTypeBadge = (type?: string) => {
    switch (type) {
      case 'compliance':
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">Compliance</span>;
      case 'announcement':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">Announcement</span>;
      default:
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">General</span>;
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
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
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-gov-blue">{m.subject}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-gray-500">
                          {new Date(m.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </p>
                        {getTypeBadge(m.messageType)}
                        {!m.readStatus && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">New</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewMsg(m)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gov-blue text-white rounded-lg text-xs hover:bg-gov-blue/90 whitespace-nowrap"
                    >
                      <Eye size={14} /> View Letter
                    </button>
                  </div>
                  <p className="text-gray-600 mt-3 text-sm line-clamp-2">{m.message.split('\n\n')[0]}...</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View message modal with formal letter format */}
      {viewMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gov-blue">{viewMsg.subject}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-gray-500">
                    {new Date(viewMsg.createdAt).toLocaleString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric', 
                      hour: 'numeric', 
                      minute: '2-digit' 
                    })}
                  </p>
                  {getTypeBadge(viewMsg.messageType)}
                </div>
              </div>
              <button type="button" onClick={() => setViewMsg(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <div className="bg-white border border-gray-200 rounded-lg p-8 font-serif text-sm whitespace-pre-wrap leading-relaxed text-gray-800 shadow-inner">
                {viewMsg.message}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
