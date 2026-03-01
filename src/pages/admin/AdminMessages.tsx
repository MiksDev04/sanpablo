import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Send } from 'lucide-react';

export default function AdminMessages() {
  const { user } = useAuth();
  const { businesses, addMessage } = useData();
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [, setTemplate] = useState<'reminder' | 'announcement' | ''>('');

  const handleTemplate = (t: 'reminder' | 'announcement') => {
    setTemplate(t);
    if (t === 'reminder') {
      setSubject('Monthly Submission Reminder');
      setMessage('Please submit your monthly guest data by the 5th of the following month. Failure to comply may result in penalties. Contact the Tourism Office if you need assistance.');
    } else {
      setSubject('System Announcement');
      setMessage('This is a system announcement from the San Pablo City Tourism Office. Please read the details below.');
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const receiverIds = recipient === 'all' ? businesses.map((b) => b.userId) : [recipient];
    receiverIds.forEach((receiverId) => {
      addMessage({
        senderId: user.id,
        receiverId,
        subject,
        message,
        readStatus: false,
      });
    });
    setRecipient('');
    setSubject('');
    setMessage('');
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gov-blue mb-6">Contact System</h1>
      <form onSubmit={handleSend} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Send To</label>
          <select
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            required
          >
            <option value="">Select accommodation</option>
            <option value="all">All Accommodations (Announcement)</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.userId}>{b.businessName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quick Templates</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleTemplate('reminder')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Compliance Reminder
            </button>
            <button
              type="button"
              onClick={() => handleTemplate('announcement')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              System Announcement
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="e.g. Monthly Submission Reminder"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Enter your message..."
            required
          />
        </div>
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-3 bg-gov-blue text-white rounded-lg font-medium hover:bg-gov-blue/90 transition-colors"
        >
          <Send size={18} /> Send Message
        </button>
      </form>
    </div>
  );
}
