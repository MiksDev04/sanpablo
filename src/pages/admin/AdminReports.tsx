import { useForm } from 'react-hook-form';
import { dummyGuestRecords, dummyBusinesses } from '../../data/dummyData';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown, Download, Printer } from 'lucide-react';

interface ReportFilters {
  month: string;
  year: string;
  nationality: string;
  ageRange: string;
  gender: string;
  transportation: string;
  accommodation: string;
}

const nationalities = ['All', ...new Set(dummyGuestRecords.map((r) => r.nationality))];
const ageRanges = ['All', '1-9', '10-17', '18-25', '26-35', '36-45', '46-55', '56+'];
const genders = ['All', 'Male', 'Female', 'LGBT+'];
const transports = ['All', 'Private Car', 'Bus', 'Van', 'Motorcycle', 'Plane', 'Other'];

const transportLabelToMode: Record<string, string> = {
  'Private Car': 'private_car', Bus: 'bus', Van: 'van', Motorcycle: 'motorcycle', Plane: 'plane', Other: 'other',
};

function filterRecords(f: ReportFilters) {
  return dummyGuestRecords.filter((r) => {
    if (f.month && f.month !== '') {
      const m = parseInt(f.month, 10);
      if (new Date(r.checkIn).getMonth() + 1 !== m) return false;
    }
    if (f.year && f.year !== '') {
      const y = parseInt(f.year, 10);
      if (new Date(r.checkIn).getFullYear() !== y) return false;
    }
    if (f.nationality && f.nationality !== 'All' && r.nationality !== f.nationality) return false;
    if (f.ageRange && f.ageRange !== 'All' && r.age !== f.ageRange) return false;
    if (f.gender && f.gender !== 'All') {
      const g = f.gender === 'LGBT+' ? 'lgbt' : f.gender.toLowerCase();
      if (r.gender !== g) return false;
    }
    if (f.transportation && f.transportation !== 'All') {
      const mode = transportLabelToMode[f.transportation];
      if (r.transportationMode !== mode) return false;
    }
    if (f.accommodation && f.accommodation !== 'All') {
      const biz = dummyBusinesses.find((b) => b.id === r.businessId);
      if (!biz || biz.businessName !== f.accommodation) return false;
    }
    return true;
  });
}

export default function AdminReports() {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

  const { register, watch } = useForm<ReportFilters>({
    defaultValues: {
      month: '',
      year: currentYear.toString(),
      nationality: 'All',
      ageRange: 'All',
      gender: 'All',
      transportation: 'All',
      accommodation: 'All',
    },
  });

  const filters = watch();
  const records = filterRecords(filters);
  const totalGuests = records.reduce((s, r) => s + r.numberOfGuests, 0);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('San Pablo City Tourism Office - Demographic Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total Guests: ${totalGuests}`, 14, 34);
    const headers = [['Check-in', 'Check-out', 'Nationality', 'Gender', 'Age', 'Transport', 'Purpose', 'Guests']];
    const rows = records.map((r) => [
      r.checkIn,
      r.checkOut,
      r.nationality,
      r.gender,
      r.age,
      r.transportationMode,
      r.purpose,
      r.numberOfGuests.toString(),
    ]);
    autoTable(doc, { head: headers, body: rows, startY: 40 });
    doc.save(`tourist-report-${Date.now()}.pdf`);
  };

  const exportCSV = () => {
    const headers = ['Check-in', 'Check-out', 'Nationality', 'Gender', 'Age', 'Transport', 'Purpose', 'Guests'];
    const rows = records.map((r) => [r.checkIn, r.checkOut, r.nationality, r.gender, r.age, r.transportationMode, r.purpose, r.numberOfGuests]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tourist-report-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const accommodationOptions = ['All', ...dummyBusinesses.map((b) => b.businessName)];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gov-blue mb-6">Reports</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gov-blue mb-4">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Month</label>
            <select {...register('month')} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">All</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, parseInt(m, 10) - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Year</label>
            <select {...register('year')} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Nationality</label>
            <select {...register('nationality')} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              {nationalities.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Age Range</label>
            <select {...register('ageRange')} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              {ageRanges.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Gender</label>
            <select {...register('gender')} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              {genders.map((g) => (
                <option key={g} value={g === 'LGBT+' ? 'LGBT+' : g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Transportation</label>
            <select {...register('transportation')} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              {transports.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Accommodation</label>
            <select {...register('accommodation')} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              {accommodationOptions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gov-blue">Results</h2>
          <p className="text-sm text-gray-600">Total: <strong>{totalGuests}</strong> guests ({records.length} records)</p>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left">Check-in</th>
                <th className="px-4 py-2 text-left">Check-out</th>
                <th className="px-4 py-2 text-left">Nationality</th>
                <th className="px-4 py-2 text-left">Gender</th>
                <th className="px-4 py-2 text-left">Age</th>
                <th className="px-4 py-2 text-left">Transport</th>
                <th className="px-4 py-2 text-left">Purpose</th>
                <th className="px-4 py-2 text-right">Guests</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{r.checkIn}</td>
                  <td className="px-4 py-2">{r.checkOut}</td>
                  <td className="px-4 py-2">{r.nationality}</td>
                  <td className="px-4 py-2">{r.gender}</td>
                  <td className="px-4 py-2">{r.age}</td>
                  <td className="px-4 py-2">{r.transportationMode}</td>
                  <td className="px-4 py-2">{r.purpose}</td>
                  <td className="px-4 py-2 text-right">{r.numberOfGuests}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 print:hidden">
        <button
          onClick={exportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-gov-blue text-white rounded-lg hover:bg-gov-blue/90"
        >
          <FileDown size={18} /> Export PDF
        </button>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Download size={18} /> Export CSV
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Printer size={18} /> Print
        </button>
      </div>
    </div>
  );
}
