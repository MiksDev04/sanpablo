import { useAuth } from '../../contexts/AuthContext';
import { dummyMonthlySubmissions } from '../../data/dummyData';
import { Check, FileCheck } from 'lucide-react';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function MonthlySubmission() {
  const { user } = useAuth();
  const businessId = user?.business?.id ?? 'biz-1';

  const submissions = dummyMonthlySubmissions
    .filter((s) => s.businessId === businessId)
    .sort((a, b) => (b.year - a.year) * 12 + (b.month - a.month));

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gov-blue mb-6">Monthly Submission</h1>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-amber-800">
          <strong>Reminder:</strong> At the end of each month, please confirm your submission for that month. Once submitted, previous month data is locked and cannot be edited.
        </p>
      </div>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gov-blue">Submission Status</h2>
        {submissions.length === 0 ? (
          <p className="text-gray-500">No submission records yet.</p>
        ) : (
          submissions.map((s) => (
            <div
              key={s.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                s.status === 'submitted' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {s.status === 'submitted' ? (
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="text-green-600" size={20} />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <FileCheck className="text-amber-600" size={20} />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gov-blue">
                    {monthNames[s.month - 1]} {s.year}
                  </p>
                  <p className="text-sm text-gray-500">
                    {s.status === 'submitted' && s.submittedAt
                      ? `Submitted on ${new Date(s.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                      : s.status === 'not_submitted'
                        ? 'Not yet submitted'
                        : ''}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  s.status === 'submitted' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {s.status === 'submitted' ? 'Submitted' : 'Not Submitted'}
              </span>
            </div>
          ))
        )}
      </div>
      <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600 mb-4">
          <strong>Current month:</strong> {monthNames[currentMonth - 1]} {currentYear}
        </p>
        <p className="text-sm text-gray-600 mb-2">
          To submit {monthNames[previousMonth - 1]} {previousYear} data, use the confirmation button below when ready.
        </p>
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 bg-gov-blue text-white rounded-lg hover:bg-gov-blue/90 transition-colors"
        >
          <Check size={18} />
          Confirm & Submit {monthNames[previousMonth - 1]} {previousYear}
        </button>
      </div>
    </div>
  );
}
