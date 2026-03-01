import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Check, X, FileText, Search } from 'lucide-react';

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export default function RegistrationApproval() {
  const { registrationRequests, updateRegistrationRequest } = useData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');

  const filtered = registrationRequests.filter((r) => {
    const matchesSearch =
      r.businessName.toLowerCase().includes(search.toLowerCase()) ||
      r.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || r.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gov-blue mb-6">Registration Approval Panel</h1>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search businesses..."
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
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No registration requests found.</p>
          </div>
        ) : (
          filtered.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gov-blue text-lg">{req.businessName}</h3>
                  <p className="text-sm text-gray-500 mt-1">Permit: {req.permitNumber}</p>
                  <p className="text-sm text-gray-600 mt-2">Owner: {req.ownerName}</p>
                  <p className="text-sm text-gray-600">Email: {req.email}</p>
                  <p className="text-sm text-gray-600">Contact: {req.contactNumber}</p>
                  <p className="text-sm text-gray-600 mt-1">Address: {req.address}</p>
                  {req.remarks && (
                    <p className="text-sm text-amber-700 mt-2 bg-amber-50 p-2 rounded">Remarks: {req.remarks}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium w-fit ${
                      req.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        req.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </span>
                  {req.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => updateRegistrationRequest(req.id, { status: 'approved' })}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Check size={18} /> Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => updateRegistrationRequest(req.id, { status: 'rejected' })}
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
                      <button
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 border border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50"
                      >
                        Add Remarks
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
