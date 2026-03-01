import {
  getTotalActiveBusinesses,
  getTotalTouristsMonth,
  getTotalTouristsYear,
  getPendingRegistrations,
  getSubmissionComplianceRate,
  getTopNationalities,
  getTouristTrendData,
} from '../../data/adminAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AdminDashboard() {
  const activeBusinesses = getTotalActiveBusinesses();
  const touristsMonth = getTotalTouristsMonth();
  const touristsYear = getTotalTouristsYear();
  const pendingReg = getPendingRegistrations();
  const complianceRate = getSubmissionComplianceRate();
  const topNationalities = getTopNationalities(5);
  const trendData = getTouristTrendData(12);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gov-blue mb-6">Tourism Office Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Active Accommodation Businesses</p>
          <p className="text-2xl font-bold text-gov-blue mt-1">{activeBusinesses}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Total Tourists (Month)</p>
          <p className="text-2xl font-bold text-gov-blue mt-1">{touristsMonth}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Total Tourists (Year)</p>
          <p className="text-2xl font-bold text-gov-blue mt-1">{touristsYear}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Pending Registrations</p>
          <p className="text-2xl font-bold text-gov-blue mt-1">{pendingReg}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gov-blue mb-4">Submission Compliance Rate</h2>
          <div className="flex items-center justify-center h-32">
            <p className="text-4xl font-bold text-primary-600">{complianceRate}</p>
          </div>
          <p className="text-sm text-gray-500 text-center">Previous month submission rate</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gov-blue mb-4">Top 5 Nationalities</h2>
          <div className="space-y-3">
            {topNationalities.map((item, idx) => (
              <div key={item.name} className="flex justify-between items-center">
                <span className="text-gray-700">{idx + 1}. {item.name}</span>
                <span className="font-semibold text-gov-blue">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gov-blue mb-4">Tourist Trend (12 Months)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="guests" name="Tourists" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
