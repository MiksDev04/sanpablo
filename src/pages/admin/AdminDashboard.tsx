import { useData } from '../../contexts/DataContext';
import {
  getTotalActiveBusinesses,
  getTotalTouristsMonth,
  getTotalTouristsYear,
  getPendingRegistrations,
  getSubmissionComplianceRate,
  getTopNationalities,
  getTouristTrendData,
  getAdminGenderDistribution,
  getAdminLocalRegionBreakdown,
} from '../../data/adminAnalytics';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const COLORS = ['#1e3a5f', '#0d6b54', '#c9a227', '#4db89a', '#80ccb7', '#1aa47d', '#a47d1a', '#5f1e3a'];

export default function AdminDashboard() {
  const { guestRecords, businesses, monthlySubmissions, registrationRequests } = useData();
  const activeBusinesses = getTotalActiveBusinesses(businesses);
  const touristsMonth = getTotalTouristsMonth(guestRecords);
  const touristsYear = getTotalTouristsYear(guestRecords);
  const pendingReg = getPendingRegistrations(registrationRequests);
  const complianceRate = getSubmissionComplianceRate(businesses, monthlySubmissions);
  const topNationalities = getTopNationalities(guestRecords, 5);
  const trendData = getTouristTrendData(guestRecords, 12);
  const genderData = getAdminGenderDistribution(guestRecords);
  const localRegionData = getAdminLocalRegionBreakdown(guestRecords);

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
          <h2 className="text-lg font-semibold text-gov-blue mb-4">Top 5 Countries</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topNationalities.length ? topNationalities : [{ name: 'No data', value: 1 }]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {topNationalities.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gov-blue mb-4">Gender Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData.length ? genderData : [{ name: 'No data', value: 1 }]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {genderData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
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
      <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gov-blue mb-4">Home Regions (Philippine Visitors)</h2>
        {localRegionData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No local region data recorded yet</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={localRegionData} margin={{ bottom: 60, left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-35} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v, 'Visitors']} />
                <Bar dataKey="value" name="Visitors" fill="#c9a227" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
