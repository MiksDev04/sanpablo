import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
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
import {
  getTotalGuestsThisMonth,
  getTotalGuestsThisYear,
  getNationalityBreakdown,
  getMonthlyTouristCount,
  getGenderDistribution,
  getAverageLengthOfStay,
  getTransportationModeData,
  getLocalRegionBreakdown,
} from '../../data/analytics';

const COLORS = ['#1e3a5f', '#0d6b54', '#c9a227', '#4db89a', '#80ccb7', '#1aa47d', '#a47d1a', '#5f1e3a'];

export default function BusinessDashboard() {
  const { user } = useAuth();
  const { guestRecords } = useData();
  const businessId = user?.business?.id ?? 'biz-1';

  const totalThisMonth = getTotalGuestsThisMonth(guestRecords, businessId);
  const totalThisYear = getTotalGuestsThisYear(guestRecords, businessId);
  const nationalityData = getNationalityBreakdown(guestRecords, businessId);
  const monthlyData = getMonthlyTouristCount(guestRecords, businessId);
  const genderData = getGenderDistribution(guestRecords, businessId);
  const avgStay = getAverageLengthOfStay(guestRecords, businessId);
  const transportData = getTransportationModeData(guestRecords, businessId);
  const mostCommonTransport = transportData[0]?.name ?? 'N/A';
  const localRegionData = getLocalRegionBreakdown(guestRecords, businessId);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gov-blue mb-6">
        {user?.business?.businessName || 'Dashboard'}
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Total Guests This Month</p>
          <p className="text-3xl font-bold text-gov-blue mt-1">{totalThisMonth}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Total Guests This Year</p>
          <p className="text-3xl font-bold text-gov-blue mt-1">{totalThisYear}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Avg. Length of Stay</p>
          <p className="text-3xl font-bold text-gov-blue mt-1">{avgStay} days</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gov-blue mb-4">Country Breakdown</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={nationalityData.length ? nationalityData : [{ name: 'No data', value: 1 }]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {nationalityData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
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
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gov-blue mb-4">Monthly Tourist Count (Last 12 Months)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="guests" name="Guests" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gov-blue mb-2">Most Common Mode of Transportation</h2>
            <p className="text-2xl font-bold text-primary-600">{mostCommonTransport}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gov-blue mb-4">Top Local Regions (Philippine Visitors)</h2>
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
