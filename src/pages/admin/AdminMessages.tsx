import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Send, Eye, History, PenLine, AlertTriangle, X } from 'lucide-react';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function buildFormalLetter(
  toName: string,
  toBusinessName: string,
  toAddress: string,
  subject: string,
  body: string,
): string {
  const now = new Date();
  const dateStr = `${MONTH_NAMES[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  return [
    'Republic of the Philippines',
    'City of San Pablo',
    'OFFICE OF THE CITY TOURISM',
    '',
    dateStr,
    '',
    toName,
    toBusinessName,
    toAddress,
    'San Pablo City, Laguna',
    '',
    `Dear ${toName},`,
    '',
    `SUBJECT: ${subject.toUpperCase()}`,
    '',
    body,
    '',
    'We hope for your full cooperation on this matter.',
    '',
    'Respectfully yours,',
    '',
    '',
    '________________________________',
    'Tourism Officer',
    'San Pablo City Tourism Office',
    'tourism@sanpablocity.gov.ph',
  ].join('\n');
}

type MsgType = 'compliance' | 'announcement' | 'general';

const DEFAULT_BODY: Record<MsgType, (bizName?: string) => string> = {
  compliance: (bizName = 'your establishment') =>
    `This is to formally inform you that as of this writing, ${bizName} has not yet submitted the required Monthly Tourist Arrival Report to the San Pablo City Tourism Office.\n\nWe wish to remind you that the submission of monthly tourist arrival data is a mandatory requirement pursuant to existing city ordinances governing tourism establishments. Failure to comply may result in administrative sanctions, including suspension of your tourism permit and blacklisting from the tourism registry.\n\nWe strongly urge you to submit the required report at the earliest possible time. Should you require assistance, please do not hesitate to contact our office.`,
  announcement:
    () => `This is to inform all registered tourism establishments of an important announcement from the San Pablo City Tourism Office.\n\n[Replace this text with your announcement details.]\n\nFor questions and clarifications, please contact the Tourism Office directly.`,
  general: () => '',
};

export default function AdminMessages() {
  const { user } = useAuth();
  const { businesses, messages, addMessage, monthlySubmissions } = useData();

  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [msgType, setMsgType] = useState<MsgType>('general');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [viewMsg, setViewMsg] = useState<(typeof messages)[0] | null>(null);
  const [filterBiz, setFilterBiz] = useState('all');
  const [filterType, setFilterType] = useState<'all' | MsgType>('all');

  // All messages sent by the admin
  const sentMessages = useMemo(
    () =>
      messages
        .filter((m) => m.senderId === user?.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [messages, user?.id],
  );

  // Compliance notices sent per business since their last submission
  const complianceCounts = useMemo(() => {
    const result = new Map<string, number>();
    businesses.forEach((biz) => {
      const lastSub = monthlySubmissions
        .filter((s) => s.businessId === biz.id && s.status === 'submitted' && s.submittedAt)
        .sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime())[0];
      const cutoff = lastSub?.submittedAt ? new Date(lastSub.submittedAt) : null;
      const count = messages.filter(
        (m) =>
          m.senderId === user?.id &&
          m.receiverId === biz.userId &&
          m.messageType === 'compliance' &&
          (!cutoff || new Date(m.createdAt) > cutoff),
      ).length;
      result.set(biz.userId, count);
    });
    return result;
  }, [businesses, messages, monthlySubmissions, user?.id]);

  const atRiskBiz = businesses.filter((b) => (complianceCounts.get(b.userId) ?? 0) >= 3);

  // Live letter preview text
  const previewLetter = useMemo(() => {
    if (!recipient || recipient === 'all') {
      return buildFormalLetter(
        'All Accommodation Managers',
        'All Registered Tourism Establishments',
        'San Pablo City, Laguna',
        subject || '(No Subject)',
        bodyText || '(No message body)',
      );
    }
    const biz = businesses.find((b) => b.userId === recipient);
    if (!biz) return '';
    return buildFormalLetter(biz.ownerName, biz.businessName, biz.address, subject || '(No Subject)', bodyText || '(No message body)');
  }, [recipient, subject, bodyText, businesses]);

  const applyTemplate = (t: MsgType) => {
    setMsgType(t);
    if (t === 'compliance') {
      setSubject('Notice of Non-Compliance: Monthly Tourist Arrival Report');
      const biz = businesses.find((b) => b.userId === recipient);
      setBodyText(DEFAULT_BODY.compliance(biz?.businessName));
    } else if (t === 'announcement') {
      setSubject('Official Announcement from the San Pablo City Tourism Office');
      setBodyText(DEFAULT_BODY.announcement());
    } else {
      setSubject('');
      setBodyText('');
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const receiverIds = recipient === 'all' ? businesses.map((b) => b.userId) : [recipient];
    receiverIds.forEach((receiverId) => {
      const biz = businesses.find((b) => b.userId === receiverId);
      const letterText = biz
        ? buildFormalLetter(biz.ownerName, biz.businessName, biz.address, subject, bodyText)
        : buildFormalLetter('All Accommodation Managers', 'All Registered Tourism Establishments', 'San Pablo City, Laguna', subject, bodyText);
      addMessage({
        senderId: user.id,
        receiverId,
        subject,
        message: letterText,
        readStatus: false,
        messageType: msgType,
      });
    });
    setRecipient('');
    setSubject('');
    setBodyText('');
    setMsgType('general');
    setActiveTab('history');
  };

  const filteredSent = useMemo(
    () =>
      sentMessages.filter((m) => {
        const bizMatch = filterBiz === 'all' || m.receiverId === filterBiz;
        const typeMatch = filterType === 'all' || m.messageType === filterType;
        return bizMatch && typeMatch;
      }),
    [sentMessages, filterBiz, filterType],
  );

  const getBizName = (userId: string) =>
    businesses.find((b) => b.userId === userId)?.businessName ?? 'Unknown';

  const typeBadge = (type: string | undefined) => {
    if (type === 'compliance')
      return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Compliance</span>;
    if (type === 'announcement')
      return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Announcement</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">General</span>;
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gov-blue mb-6">Messages</h1>

      {/* Blacklist warning */}
      {atRiskBiz.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
          <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 text-sm">Blacklist Warning</p>
            <p className="text-xs text-red-600 mt-0.5">
              The following establishment(s) have received 3 or more compliance notices without submitting a monthly
              report:{' '}
              <span className="font-medium">{atRiskBiz.map((b) => b.businessName).join(', ')}</span>. Consider
              taking further action.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {([
          { key: 'compose', label: 'Compose', icon: <PenLine size={14} /> },
          { key: 'history', label: 'Sent History', icon: <History size={14} />, count: sentMessages.length },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-gov-blue text-white'
                : 'text-gray-500 hover:text-gov-blue hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            {tab.label}
            {'count' in tab && tab.count > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* COMPOSE TAB */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Send To *</label>
              <select
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gov-blue/30 text-sm"
                required
              >
                <option value="">Select recipient</option>
                <option value="all">All Accommodations (Broadcast)</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.userId}>
                    {b.businessName}{(complianceCounts.get(b.userId) ?? 0) >= 3 ? ' ⚠️' : ''}
                  </option>
                ))}
              </select>
              {recipient && recipient !== 'all' && (() => {
                const count = complianceCounts.get(recipient) ?? 0;
                if (!count) return null;
                return (
                  <p className={`text-xs mt-1 ${count >= 3 ? 'text-red-600 font-medium' : 'text-amber-600'}`}>
                    ⚠ {count} compliance notice{count !== 1 ? 's' : ''} sent since last submission
                    {count >= 3 && ' — eligible for blacklisting'}
                  </p>
                );
              })()}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message Type</label>
              <div className="flex gap-2 flex-wrap">
                {(['compliance', 'announcement', 'general'] as MsgType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      msgType === t
                        ? t === 'compliance'
                          ? 'bg-red-600 text-white border-red-600'
                          : t === 'announcement'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-gray-700 text-white border-gray-700'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gov-blue/30 text-sm"
                placeholder="e.g. Notice of Non-Compliance"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message Body *</label>
              <textarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                rows={9}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gov-blue/30 text-sm"
                placeholder="Write the body of your letter here..."
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                disabled={!subject || !bodyText}
                className="flex items-center gap-2 px-4 py-2 border border-gov-blue text-gov-blue rounded-lg text-sm hover:bg-gov-blue/5 disabled:opacity-40"
              >
                <Eye size={15} /> Preview Letter
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-gov-blue text-white rounded-lg text-sm hover:bg-gov-blue/90"
              >
                <Send size={15} /> Send
              </button>
            </div>
          </form>

          {/* Desktop letter preview */}
          <div className="hidden lg:flex flex-col">
            <p className="text-sm font-medium text-gray-600 mb-2">Letter Preview</p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-xs font-mono whitespace-pre-wrap text-gray-700 flex-1 overflow-auto min-h-[420px]">
              {recipient || subject || bodyText ? (
                previewLetter
              ) : (
                <span className="text-gray-400">Fill in the form to see the formatted letter.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <div>
          {/* Compliance tracker */}
          {businesses.some((b) => (complianceCounts.get(b.userId) ?? 0) > 0) && (
            <div className="mb-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-sm font-semibold text-gov-blue mb-3">Compliance Notice Tracker</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {businesses
                  .filter((b) => (complianceCounts.get(b.userId) ?? 0) > 0)
                  .map((b) => {
                    const count = complianceCounts.get(b.userId) ?? 0;
                    return (
                      <div
                        key={b.id}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs border ${
                          count >= 3 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                        }`}
                      >
                        <span className="font-medium text-gray-700 truncate mr-2">{b.businessName}</span>
                        <span className={`font-bold whitespace-nowrap ${
                          count >= 3 ? 'text-red-600' : 'text-amber-700'
                        }`}>
                          {count} / 3 {count >= 3 && '⚠️'}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <select
              value={filterBiz}
              onChange={(e) => setFilterBiz(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gov-blue/30"
            >
              <option value="all">All Recipients</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.userId}>{b.businessName}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gov-blue/30"
            >
              <option value="all">All Types</option>
              <option value="compliance">Compliance</option>
              <option value="announcement">Announcement</option>
              <option value="general">General</option>
            </select>
          </div>

          {filteredSent.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-sm text-gray-400">No sent messages found.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left">
                    <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Date Sent</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Recipient</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Type</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Subject</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSent.map((msg) => (
                    <tr key={msg.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">{fmtDate(msg.createdAt)}</td>
                      <td className="px-4 py-3 font-medium text-gov-blue whitespace-nowrap">
                        {getBizName(msg.receiverId)}
                      </td>
                      <td className="px-4 py-3">{typeBadge(msg.messageType)}</td>
                      <td className="px-4 py-3 text-gray-700">{msg.subject}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setViewMsg(msg)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-gov-blue text-white rounded-lg text-xs hover:bg-gov-blue/90"
                        >
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Preview modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gov-blue">Formal Letter Preview</h2>
              <button type="button" onClick={() => setPreviewOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <div className="bg-white border border-gray-200 rounded-lg p-8 font-serif text-sm whitespace-pre-wrap leading-relaxed text-gray-800 shadow-inner">
                {previewLetter}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View sent message modal */}
      {viewMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gov-blue">{viewMsg.subject}</h2>
                <p className="text-xs text-gray-400">
                  Sent {fmtDate(viewMsg.createdAt)} · To: {getBizName(viewMsg.receiverId)}
                </p>
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
