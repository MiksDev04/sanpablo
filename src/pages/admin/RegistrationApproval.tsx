import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Check, X, Ban, FileText, Search, Building2, Info, MapPin, Phone, Mail, User, Shield, ExternalLink } from 'lucide-react';
import type { RegistrationRequest, Business } from '../../types';

type TabStatus = 'all' | 'pending' | 'approved' | 'rejected' | 'blacklisted';

type AccommodationEntry =
  | { type: 'request'; data: RegistrationRequest }
  | { type: 'system'; data: Business };

export default function RegistrationApproval() {
  const { registrationRequests, businesses, updateRegistrationRequest } = useData();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabStatus>('all');
  const [blacklistTargetId, setBlacklistTargetId] = useState<string | null>(null);
  const [detailsEntry, setDetailsEntry] = useState<AccommodationEntry | null>(null);

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
  function getOwner(entry: AccommodationEntry): string {
    return entry.type === 'request'
      ? (entry.data as RegistrationRequest).ownerName
      : (entry.data as Business).ownerName;
  }
  function getPermit(entry: AccommodationEntry): string {
    return entry.data.permitNumber;
  }
  function getContact(entry: AccommodationEntry): string {
    return entry.data.contactNumber;
  }
  function getAddress(entry: AccommodationEntry): string {
    return entry.data.address;
  }
  function getEmail(entry: AccommodationEntry): string | undefined {
    if (entry.type === 'request') {
      return (entry.data as RegistrationRequest).email;
    }
    return (entry.data as Business).email;
  }
  function getId(entry: AccommodationEntry): string {
    return entry.type === 'request' ? (entry.data as RegistrationRequest).id : (entry.data as Business).id;
  }
  function getPermitFileUrl(entry: AccommodationEntry): string | undefined {
    return entry.data.permitFileUrl;
  }
  function getValidIdUrl(entry: AccommodationEntry): string | undefined {
    return entry.data.validIdUrl;
  }
  function getTotalRooms(entry: AccommodationEntry): number | undefined {
    return entry.type === 'system' ? (entry.data as Business).totalRooms : undefined;
  }
  function getRemarks(entry: AccommodationEntry): string | undefined {
    return entry.type === 'request' ? (entry.data as RegistrationRequest).remarks : undefined;
  }

  const countFor = (tab: TabStatus) =>
    tab === 'all'
      ? allEntries.length
      : allEntries.filter((e) => getStatus(e) === tab).length;

  const filtered = allEntries
    .filter((entry) => {
      const status = getStatus(entry);
      const name = getName(entry).toLowerCase();
      const matchesSearch =
        name.includes(search.toLowerCase()) ||
        getOwner(entry).toLowerCase().includes(search.toLowerCase()) ||
        (getEmail(entry) ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesTab = activeTab === 'all' || status === activeTab;
      return matchesSearch && matchesTab;
    })
    .sort((a, b) => {
      const order: Record<string, number> = { pending: 0, approved: 1, rejected: 2, blacklisted: 3 };
      return (order[getStatus(a)] ?? 99) - (order[getStatus(b)] ?? 99);
    });

  const tabs: { key: TabStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'blacklisted', label: 'Blacklisted' },
  ];

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      blacklisted: 'bg-gray-200 text-gray-700',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gov-blue/10 rounded-lg">
          <Building2 size={24} className="text-gov-blue" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gov-blue">Accommodations</h1>
          <p className="text-sm text-gray-500">
            {allEntries.length} total
            {countFor('pending') > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                {countFor('pending')} pending
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-gov-blue text-white'
                : 'text-gray-500 hover:text-gov-blue hover:bg-gray-50'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
              activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {countFor(tab.key)}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, owner, or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gov-blue/30 focus:border-gov-blue"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No accommodations found.</p>
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Business Name</th>
                <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Owner</th>
                <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Permit No.</th>
                <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Contact</th>
                <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Address</th>
                <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((entry) => {
                const status = getStatus(entry);
                const isRequest = entry.type === 'request';
                const req = isRequest ? (entry.data as RegistrationRequest) : null;
                const id = getId(entry);
                return (
                  <tr key={id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-gov-blue">{getName(entry)}</span>
                        {!isRequest && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-200">System</span>
                        )}
                      </div>
                      {req?.remarks && (
                        <p className="text-xs text-amber-700 mt-0.5">Remarks: {req.remarks}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div>{getOwner(entry)}</div>
                      {getEmail(entry) && (
                        <div className="text-xs text-gray-400">{getEmail(entry)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{getPermit(entry)}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{getContact(entry)}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs">{getAddress(entry)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{statusBadge(status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDetailsEntry(entry)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-gov-blue text-white rounded-lg text-xs hover:bg-gov-blue/90"
                        >
                          <Info size={13} /> Details
                        </button>
                        {isRequest && req!.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => updateRegistrationRequest(req!.id, { status: 'approved' })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700"
                            >
                              <Check size={13} /> Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => updateRegistrationRequest(req!.id, { status: 'rejected' })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700"
                            >
                              <X size={13} /> Reject
                            </button>
                          </>
                        )}
                        {isRequest && req!.status === 'approved' && (
                          <button
                            type="button"
                            onClick={() => setBlacklistTargetId(req!.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-700 text-white rounded-lg text-xs hover:bg-gray-900"
                          >
                            <Ban size={13} /> Blacklist
                          </button>
                        )}
                        {isRequest && req!.status === 'blacklisted' && (
                          <button
                            type="button"
                            onClick={() => updateRegistrationRequest(req!.id, { status: 'approved' })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700"
                          >
                            <Check size={13} /> Restore
                          </button>
                        )}
                        {isRequest && req!.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-300 text-gray-500 rounded-lg text-xs cursor-not-allowed">
                            <X size={13} /> Rejected (Final)
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Details Modal */}
      {detailsEntry && (() => {
        const entry = detailsEntry;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full my-8">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gov-blue/10 rounded-lg">
                    <Building2 size={20} className="text-gov-blue" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">Accommodation Details</h2>
                    <p className="text-xs text-gray-500">{getName(entry)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailsEntry(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-6 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Status:</span>
                  {statusBadge(getStatus(entry))}
                  {entry.type === 'system' && (
                    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-200">
                      System Account
                    </span>
                  )}
                </div>

                {/* Business Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Building2 size={16} />
                    Business Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Business Name</p>
                      <p className="text-sm font-medium text-gray-900">{getName(entry)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Permit Number</p>
                      <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                        <Shield size={14} className="text-gov-blue" />
                        {getPermit(entry)}
                      </p>
                    </div>
                    {getTotalRooms(entry) && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total Rooms</p>
                        <p className="text-sm font-medium text-gray-900">{getTotalRooms(entry)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Owner Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <User size={16} />
                    Owner Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Owner Name</p>
                      <p className="text-sm font-medium text-gray-900">{getOwner(entry)}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Phone size={16} />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Contact Number</p>
                      <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                        <Phone size={14} className="text-primary-600" />
                        {getContact(entry)}
                      </p>
                    </div>
                    {getEmail(entry) && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Email Address</p>
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                          <Mail size={14} className="text-primary-600" />
                          {getEmail(entry)}
                        </p>
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-500 mb-1">Address</p>
                      <p className="text-sm font-medium text-gray-900 flex items-start gap-1">
                        <MapPin size={14} className="text-primary-600 mt-0.5 flex-shrink-0" />
                        <span>{getAddress(entry)}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Remarks (if any) */}
                {getRemarks(entry) && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Remarks</h3>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-800">{getRemarks(entry)}</p>
                    </div>
                  </div>
                )}

                {/* Business Documents */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText size={16} />
                    Business Documents
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">Business Permit</p>
                      {getPermitFileUrl(entry) ? (
                        <a
                          href={getPermitFileUrl(entry)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-gov-blue hover:text-gov-blue/80 font-medium"
                        >
                          <ExternalLink size={14} />
                          View Permit Document
                        </a>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No document uploaded</p>
                      )}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">Valid ID</p>
                      {getValidIdUrl(entry) ? (
                        <a
                          href={getValidIdUrl(entry)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-gov-blue hover:text-gov-blue/80 font-medium"
                        >
                          <ExternalLink size={14} />
                          View Valid ID
                        </a>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No document uploaded</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetailsEntry(null)}
                  className="px-4 py-2 bg-gov-blue text-white rounded-lg text-sm hover:bg-gov-blue/90"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Blacklist Confirmation Modal */}
      {blacklistTargetId && (() => {
        const target = registrationRequests.find((r) => r.id === blacklistTargetId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Ban size={20} className="text-red-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-800">Confirm Blacklist</h2>
              </div>
              <div className="px-6 py-4 text-sm text-gray-700 space-y-2">
                <p>
                  Are you sure you want to blacklist{' '}
                  <span className="font-semibold">{target?.businessName ?? 'this accommodation'}</span>?
                </p>
                <p className="text-xs text-gray-500">
                  This will mark the accommodation as blacklisted. You can restore it later.
                </p>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBlacklistTargetId(null)}
                  className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateRegistrationRequest(blacklistTargetId, { status: 'blacklisted' });
                    setBlacklistTargetId(null);
                  }}
                  className="px-4 py-1.5 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900"
                >
                  Confirm Blacklist
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

