import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Check, X, FileText, Search, Building2 } from 'lucide-react';
import type { RegistrationRequest, Business } from '../../types';

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

type AccommodationEntry =
  | { type: 'request'; data: RegistrationRequest }
  | { type: 'system'; data: Business };

const statusOrder: Record<string, number> = { pending: 0, approved: 1, rejected: 2 };

export default function RegistrationApproval() {
  const { registrationRequests, businesses, updateRegistrationRequest } = useData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');

  // Build unified list: registration requests + system businesses not covered by a request
  const requestPermits = new Set(registrationRequests.map((r) => r.permitNumber));
  const systemEntries: AccommodationEntry[] = businesses
    .filter((b) => !requestPermits.has(b.permitNumber))
    .map((b) => ({ type: 'system', data: b }));

  const requestEntries: AccommodationEntry[] = registrationRequests.map((r) => ({
    type: 'request',
    data: r,
  }));

  const allEntries: AccommodationEntry[] = [...requestEntries, ...systemEntries];

  function getStatus(entry: AccommodationEntry): string {
    if (entry.type === 'system') return 'approved';
    return entry.data.status;
  }

  function getName(entry: AccommodationEntry): string {
    return entry.data.businessName;
  }

  const filtered = allEntries
    .filter((entry) => {
      const status = getStatus(entry);
      const name = getName(entry).toLowerCase();
      const matchesSearch =
        name.includes(search.toLowerCase()) ||
        (entry.type === 'request'
          ? (entry.data as RegistrationRequest).ownerName.toLowerCase().includes(search.toLowerCase()) ||
            (entry.data as RegistrationRequest).email.toLowerCase().includes(search.toLowerCase())
          : (entry.data as Business).ownerName.toLowerCase().includes(search.toLowerCase()));
      const matchesFilter = filter === 'all' || status === filter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => (statusOrder[getStatus(a)] ?? 99) - (statusOrder[getStatus(b)] ?? 99));

  const pendingCount = allEntries.filter((e) => getStatus(e) === 'pending').length;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gov-blue/10 rounded-lg">
          <Building2 size={24} className="text-gov-blue" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gov-blue">Accommodations</h1>
          <p className="text-sm text-gray-500">
            {allEntries.length} total
            {pendingCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                {pendingCount} pending
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search accommodations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterStatus)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No accommodations found.</p>
          </div>
        ) : (
          filtered.map((entry) => {
            const status = getStatus(entry);
            const isRequest = entry.type === 'request';
            const req = isRequest ? (entry.data as RegistrationRequest) : null;
            const biz = !isRequest ? (entry.data as Business) : null;
            const businessName = isRequest ? req!.businessName : biz!.businessName;
            const permitNumber = isRequest ? req!.permitNumber : biz!.permitNumber;
            const ownerName = isRequest ? req!.ownerName : biz!.ownerName;
            const address = isRequest ? req!.address : biz!.address;
            const contactNumber = isRequest ? req!.contactNumber : biz!.contactNumber;
            const email = isRequest ? req!.email : undefined;
            return (
              <div
                key={isRequest ? req!.id : biz!.id}
                className={`bg-white rounded-xl border shadow-sm p-6 ${
                  status === 'pending' ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gov-blue text-lg">{businessName}</h3>
                      {!isRequest && (
                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-200">
                          System Account
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Permit: {permitNumber}</p>
                    <p className="text-sm text-gray-600 mt-2">Owner: {ownerName}</p>
                    {email && <p className="text-sm text-gray-600">Email: {email}</p>}
                    <p className="text-sm text-gray-600">Contact: {contactNumber}</p>
                    <p className="text-sm text-gray-600 mt-1">Address: {address}</p>
                    {req?.remarks && (
                      <p className="text-sm text-amber-700 mt-2 bg-amber-50 p-2 rounded">
                        Remarks: {req.remarks}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium w-fit ${
                        status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                    {isRequest && req!.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => updateRegistrationRequest(req!.id, { status: 'approved' })}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Check size={18} /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => updateRegistrationRequest(req!.id, { status: 'rejected' })}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <X size={18} /> Reject
                        </button>
                        <button
                          type="button"
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          <FileText size={18} /> View Documents
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
