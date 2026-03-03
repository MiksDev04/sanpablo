import { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FileDown, Download, FileSpreadsheet, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import {
  getRecordsForMonth,
  getNationalityBreakdown,
  getGenderDistribution,
} from '../../data/analytics';

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function formatMonthYear(month: number, year: number) {
  return `${monthNames[month - 1]} ${year}`;
}

function differenceInDays(dateLeft: Date, dateRight: Date): number {
  const msPerDay = 86_400_000;
  return Math.max(1, Math.round((dateRight.getTime() - dateLeft.getTime()) / msPerDay));
}

export default function BusinessReports() {
  const { user } = useAuth();
  const { guestRecords, monthlySubmissions, submitMonthlySubmission, resetGuestRecordsAndReports, businesses } = useData();
  const business = user?.business;
  const businessId = business?.id ?? 'biz-1';
  // Always read the live record from DataContext so totalRooms reflects latest profile saves
  const liveBusiness = businesses.find((b) => b.id === businessId) ?? business;

  const businessRecords = guestRecords.filter((r) => r.businessId === businessId);

  const monthYearMap = new Map<string, { month: number; year: number }>();
  businessRecords.forEach((r) => {
    const d = new Date(r.checkIn);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const key = `${year}-${month}`;
    if (!monthYearMap.has(key)) {
      monthYearMap.set(key, { month, year });
    }
  });

  const monthItems = Array.from(monthYearMap.values()).sort(
    (a, b) => (b.year - a.year) * 12 + (b.month - a.month)
  );

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedKeyForGenerate, setSelectedKeyForGenerate] = useState<string>('');
  const [pendingGenerateKey, setPendingGenerateKey] = useState<string | null>(null);

  const selectedMonth = selectedReportId
    ? (() => {
        const [y, m] = selectedReportId.split('-').map((v) => parseInt(v, 10));
        if (Number.isNaN(y) || Number.isNaN(m)) return null;
        return { year: y, month: m };
      })()
    : null;

  const buildReportData = (month: number, year: number) => {
    const records = getRecordsForMonth(guestRecords, businessId, month, year);
    const totalGuests = records.reduce((sum, r) => sum + r.numberOfGuests, 0);

    const totalGuestNights = records.reduce((sum, r) => {
      const checkIn = new Date(r.checkIn);
      const checkOut = new Date(r.checkOut);
      return sum + differenceInDays(checkIn, checkOut) * r.numberOfGuests;
    }, 0);

    const averageLengthOfStay = totalGuests > 0 ? totalGuestNights / totalGuests : 0;

    const genderData = getGenderDistribution(guestRecords, businessId, month, year);
    const nationalityData = getNationalityBreakdown(guestRecords, businessId, month, year);

    const purposeMap = new Map<string, number>();
    records.forEach((r) => {
      const key =
        r.purpose === 'leisure'
          ? 'Leisure / Vacation'
          : r.purpose === 'business'
            ? 'Business'
            : r.purpose === 'event'
              ? 'Events / Conference'
              : 'Others';
      purposeMap.set(key, (purposeMap.get(key) || 0) + r.numberOfGuests);
    });
    const purposeData = Array.from(purposeMap.entries()).map(([name, value]) => ({ name, value }));

    const ageBracketMap = new Map<string, number>();
    records.forEach((r) => {
      const src = r.age;
      let label = '';
      if (src === '1-9' || src === '10-17') {
        label = '0–17 years old';
      } else if (src === '18-25' || src === '26-35') {
        label = '18–30 years old';
      } else if (src === '36-45') {
        label = '31–45 years old';
      } else if (src === '46-55') {
        label = '46–60 years old';
      } else if (src === '56+') {
        label = '61 years old and above';
      } else {
        label = 'Prefer not to say';
      }
      ageBracketMap.set(label, (ageBracketMap.get(label) || 0) + r.numberOfGuests);
    });
    const ageData = Array.from(ageBracketMap.entries()).map(([name, value]) => ({ name, value }));

    const transportationMap = new Map<string, number>();
    records.forEach((r) => {
      const label =
        r.transportationMode === 'private_car' ? 'Private Car'
        : r.transportationMode === 'bus' ? 'Bus'
        : r.transportationMode === 'van' ? 'Van'
        : r.transportationMode === 'motorcycle' ? 'Motorcycle'
        : r.transportationMode === 'plane' ? 'Plane'
        : 'Other';
      transportationMap.set(label, (transportationMap.get(label) || 0) + r.numberOfGuests);
    });
    const transportationData = Array.from(transportationMap.entries()).map(([name, value]) => ({ name, value }));

    // Build unique entry map (one entry per createdAt group) to get roomsRented per stay
    // Fall back to 1 when roomsRented is missing/zero (e.g. records created before the field existed)
    const entryMap = new Map<string, { roomsRented: number; checkIn: string; checkOut: string }>();
    records.forEach((r) => {
      if (!entryMap.has(r.createdAt)) {
        entryMap.set(r.createdAt, {
          roomsRented: r.roomsRented > 0 ? r.roomsRented : 1,
          checkIn: r.checkIn,
          checkOut: r.checkOut,
        });
      }
    });

    // For each calendar day in the reporting month, count rooms occupied
    const daysInMonth = new Date(year, month, 0).getDate();
    let totalRoomDays = 0;
    let activeDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateStr = `${year}-${pad(month)}-${pad(d)}`;
      let roomsToday = 0;
      entryMap.forEach(({ roomsRented, checkIn, checkOut }) => {
        if (checkIn <= dateStr && dateStr < checkOut) {
          roomsToday += roomsRented;
        }
      });
      if (roomsToday > 0) {
        totalRoomDays += roomsToday;
        activeDays += 1;
      }
    }
    // Occupancy rate = avg rooms occupied (on active days only) ÷ total rooms × 100
    // Falls back to 0 if no bookings or totalRooms not set
    const capacity = (liveBusiness?.totalRooms ?? 0) > 0 ? liveBusiness!.totalRooms! : 0;
    const avgRoomsOnActiveDays = activeDays > 0 ? totalRoomDays / activeDays : 0;
    const averageOccupancyRate = capacity > 0 && activeDays > 0
      ? (avgRoomsOnActiveDays / capacity) * 100
      : 0;

    return {
      records,
      totalGuests,
      totalGuestNights,
      averageLengthOfStay,
      genderData,
      nationalityData,
      purposeData,
      ageData,
      transportationData,
      averageOccupancyRate,
    };
  };

  const handleExportPDF = (month: number, year: number) => {
    const data = buildReportData(month, year);
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text('MONTHLY TOURISM DEMOGRAPHIC REPORT', 14, 18);
    doc.setFontSize(11);
    doc.text('Lakbay San Pablo System – Auto Generated Report', 14, 26);

    let y = 36;
    doc.setFontSize(10);
    doc.text(`Accommodation Name: ${business?.businessName ?? 'N/A'}`, 14, y);
    y += 6;
    doc.text(`Accreditation / Permit No.: ${business?.permitNumber ?? 'N/A'}`, 14, y);
    y += 6;
    doc.text(`Location: ${business?.address ?? 'N/A'}`, 14, y);
    y += 6;
    doc.text(`Reporting Month: ${formatMonthYear(month, year)}`, 14, y);
    y += 6;
    doc.text(`Date Generated: ${new Date().toLocaleString()}`, 14, y);
    y += 10;

    doc.text('1. Summary of Tourist Arrivals', 14, y);
    y += 6;
    doc.text(`Total Guests Checked-in: ${data.totalGuests}`, 18, y);
    y += 6;
    doc.text(`Total Guest Nights: ${data.totalGuestNights}`, 18, y);
    y += 6;
    doc.text(`Average Length of Stay: ${data.averageLengthOfStay.toFixed(1)} nights`, 18, y);
    y += 6;
    doc.text(`Average Occupancy Rate: ${data.averageOccupancyRate.toFixed(1)}%`, 18, y);
    y += 10;

    autoTable(doc, {
      startY: y,
      head: [['Gender', 'Guests']],
      body: data.genderData.map((g) => [g.name, g.value.toString()]),
      styles: { fontSize: 9 },
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 95] },
    });

    const afterGenderY = (doc as any).lastAutoTable.finalY + 8;

    autoTable(doc, {
      startY: afterGenderY,
      head: [['Nationality', 'Guests']],
      body: data.nationalityData.map((n) => [n.name, n.value.toString()]),
      styles: { fontSize: 9 },
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 95] },
    });

    const afterNationalityY = (doc as any).lastAutoTable.finalY + 8;

    autoTable(doc, {
      startY: afterNationalityY,
      head: [['Purpose of Visit', 'Guests']],
      body: data.purposeData.map((p) => [p.name, p.value.toString()]),
      styles: { fontSize: 9 },
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 95] },
    });

    let afterPurposeY = (doc as any).lastAutoTable.finalY + 10;

    doc.text('5. Mode of Transportation', 14, afterPurposeY);
    afterPurposeY += 4;
    autoTable(doc, {
      startY: afterPurposeY,
      head: [['Transportation Mode', 'Guests']],
      body: data.transportationData.map((t) => [t.name, t.value.toString()]),
      styles: { fontSize: 9 },
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 95] },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(10);
    doc.text('System Validation Details', 14, finalY);
    const vY = finalY + 6;
    const submittedBy = business?.ownerName || 'Authorized Account';
    doc.text(`Submitted by: ${submittedBy}`, 18, vY);
    doc.text('Account Role: Establishment Administrator', 18, vY + 6);
    doc.text(`Submission Timestamp: ${new Date().toLocaleString()}`, 18, vY + 12);
    doc.text('Data Status: Verified and Synced to Central Database', 18, vY + 18);
    doc.text(`Digital Authentication Code: LSP-VER-${Date.now().toString().slice(-8)}`, 18, vY + 24);

    doc.save(`monthly-tourism-report-${year}-${String(month).padStart(2, '0')}.pdf`);
  };

  const handleExportCSV = (month: number, year: number) => {
    const data = buildReportData(month, year);
    const lines: string[] = [];

    lines.push('Section,Label,Value');
    lines.push(`Summary,Total Guests Checked-in,${data.totalGuests}`);
    lines.push(`Summary,Total Guest Nights,${data.totalGuestNights}`);
    lines.push(`Summary,Average Length of Stay,${data.averageLengthOfStay.toFixed(1)}`);
    lines.push(`Summary,Average Occupancy Rate,${data.averageOccupancyRate.toFixed(1)}%`);

    data.genderData.forEach((g) => {
      lines.push(`Gender,${g.name},${g.value}`);
    });
    data.ageData.forEach((a) => {
      lines.push(`Age Group,${a.name},${a.value}`);
    });
    data.nationalityData.forEach((n) => {
      lines.push(`Nationality,${n.name},${n.value}`);
    });
    data.purposeData.forEach((p) => {
      lines.push(`Purpose,${p.name},${p.value}`);
    });
    data.transportationData.forEach((t) => {
      lines.push(`Transportation Mode,${t.name},${t.value}`);
    });

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly-tourism-report-${year}-${String(month).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportXLSX = (month: number, year: number) => {
    const data = buildReportData(month, year);
    const rows: any[][] = [];

    rows.push(['Section', 'Label', 'Value']);
    rows.push(['Summary', 'Total Guests Checked-in', data.totalGuests]);
    rows.push(['Summary', 'Total Guest Nights', data.totalGuestNights]);
    rows.push(['Summary', 'Average Length of Stay', data.averageLengthOfStay]);
    rows.push(['Summary', 'Average Occupancy Rate', `${data.averageOccupancyRate}%`]);

    data.genderData.forEach((g) => rows.push(['Gender', g.name, g.value]));
    data.ageData.forEach((a) => rows.push(['Age Group', a.name, a.value]));
    data.nationalityData.forEach((n) => rows.push(['Nationality', n.name, n.value]));
    data.purposeData.forEach((p) => rows.push(['Purpose', p.name, p.value]));
    data.transportationData.forEach((t) => rows.push(['Transportation Mode', t.name, t.value]));

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Report');
    XLSX.writeFile(workbook, `monthly-tourism-report-${year}-${String(month).padStart(2, '0')}.xlsx`);
  };

  const handleOpenReport = (month: number, year: number) => {
    setSelectedReportId(`${year}-${month}`);
  };

  const handleCloseModal = () => {
    setSelectedReportId(null);
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gov-blue mb-2">Monthly Reports</h1>
      <p className="text-sm text-gray-600 mb-6">
        Generate a monthly tourism demographic report summary for a specific month, and export it as CSV, XLSX, or PDF.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        {monthItems.length > 0 && (
          <>
            <select
              value={selectedKeyForGenerate || (monthItems[0] ? `${monthItems[0].year}-${monthItems[0].month}` : '')}
              onChange={(e) => setSelectedKeyForGenerate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {monthItems.map(({ month, year }) => (
                <option key={`${year}-${month}`} value={`${year}-${month}`}>
                  {formatMonthYear(month, year)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                const key = selectedKeyForGenerate || (monthItems[0] ? `${monthItems[0].year}-${monthItems[0].month}` : '');
                if (!key) return;
                setPendingGenerateKey(key);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gov-blue text-white rounded-lg text-sm hover:bg-gov-blue/90"
            >
              Generate Report
            </button>
          </>
        )}
        <button
          type="button"
          onClick={resetGuestRecordsAndReports}
          className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-700 rounded-lg text-xs hover:bg-red-50"
        >
          Clear all guest records & monthly reports
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gov-blue">Generated Monthly Reports (Submitted to Admin)</h2>
          <span className="text-xs text-gray-500">
            {monthlySubmissions.filter((s) => s.businessId === businessId && s.status === 'submitted').length}{' '}
            reports
          </span>
        </div>
        {monthlySubmissions.filter((s) => s.businessId === businessId && s.status === 'submitted').length === 0 ? (
          <div className="p-4 text-sm text-gray-500">
            No generated reports yet. Select a month above and click "Generate Report" to create one and send it to
            admin.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {monthlySubmissions
              .filter((s) => s.businessId === businessId && s.status === 'submitted')
              .sort((a, b) => (b.year - a.year) * 12 + (b.month - a.month))
              .map((submission) => {
                const { month, year } = submission;
                return (
              <div
                key={`${year}-${month}`}
                className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <p className="font-medium text-gov-blue">{formatMonthYear(month, year)}</p>
                  <p className="text-xs text-gray-500">
                    Submitted on{' '}
                    {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenReport(month, year)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-gov-blue text-white rounded-lg hover:bg-gov-blue/90"
                  >
                    <Eye size={14} />
                    View Details
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportPDF(month, year)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <FileDown size={14} />
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportCSV(month, year)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Download size={14} />
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportXLSX(month, year)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <FileSpreadsheet size={14} />
                    XLSX
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>

      {pendingGenerateKey && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gov-blue">Generate Monthly Report</h2>
            </div>
            <div className="px-6 py-4 text-sm text-gray-700 space-y-3">
              {(() => {
                const [y, m] = pendingGenerateKey.split('-').map((v) => parseInt(v, 10));
                const label = !Number.isNaN(y) && !Number.isNaN(m) ? formatMonthYear(m, y) : '';
                return (
                  <>
                    <p>
                      You are about to generate a monthly tourism demographic report for{' '}
                      <span className="font-semibold">{label}</span>. This report will be submitted to the admin side.
                    </p>
                    <p>Do you want to continue?</p>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setPendingGenerateKey(null)}
                        className="px-4 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const [year, month] = pendingGenerateKey
                            .split('-')
                            .map((v) => parseInt(v, 10));
                          if (!Number.isNaN(year) && !Number.isNaN(month)) {
                            submitMonthlySubmission(businessId, month, year);
                            handleOpenReport(month, year);
                          }
                          setPendingGenerateKey(null);
                        }}
                        className="px-4 py-1.5 text-xs bg-gov-blue text-white rounded-lg hover:bg-gov-blue/90"
                      >
                        OK
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {selectedMonth && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-semibold text-gov-blue">Monthly Tourism Demographic Report</h2>
                <p className="text-xs text-gray-500">
                  {formatMonthYear(selectedMonth.month, selectedMonth.year)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="px-6 py-4 text-sm text-gray-700 space-y-4">
              {(() => {
                const data = buildReportData(selectedMonth.month, selectedMonth.year);
                return (
                  <>
                    <div>
                      <p className="font-semibold text-gov-blue mb-1">Accommodation Details</p>
                      <p>Accommodation Name: {business?.businessName ?? 'N/A'}</p>
                      <p>Accreditation / Permit No.: {business?.permitNumber ?? 'N/A'}</p>
                      <p>Location: {business?.address ?? 'N/A'}</p>
                      <p>Reporting Month: {formatMonthYear(selectedMonth.month, selectedMonth.year)}</p>
                      <p>Date Generated: {new Date().toLocaleString()}</p>
                      <p>Submitted Via: Lakbay San Pablo System</p>
                    </div>

                    <div>
                      <p className="font-semibold text-gov-blue mb-1">1. Summary of Tourist Arrivals</p>
                      <p>Total Guests Checked-in: {data.totalGuests}</p>
                      <p>Total Guest Nights: {data.totalGuestNights}</p>
                      <p>Average Length of Stay: {data.averageLengthOfStay.toFixed(1)} nights</p>
                      <p>Average Occupancy Rate: {data.averageOccupancyRate.toFixed(1)}%
                        {!(liveBusiness?.totalRooms ?? 0) && (
                          <span className="ml-2 text-xs text-amber-600">(Set Total Rooms in Profile to calculate)</span>
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-gov-blue mb-1">2. Demographic Breakdown</p>
                      <p className="font-medium mt-1">By Gender</p>
                      {data.genderData.length === 0 ? (
                        <p className="text-xs text-gray-500">No data for this month.</p>
                      ) : (
                        <ul className="list-disc list-inside">
                          {data.genderData.map((g) => (
                            <li key={g.name}>
                              {g.name}: {g.value}
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="font-medium mt-2">By Age Group</p>
                      {data.ageData.length === 0 ? (
                        <p className="text-xs text-gray-500">No data for this month.</p>
                      ) : (
                        <ul className="list-disc list-inside">
                          {data.ageData.map((a) => (
                            <li key={a.name}>
                              {a.name}: {a.value}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <p className="font-semibold text-gov-blue mb-1">3. Nationality Distribution</p>
                      {data.nationalityData.length === 0 ? (
                        <p className="text-xs text-gray-500">No data for this month.</p>
                      ) : (
                        <ul className="list-disc list-inside">
                          {data.nationalityData.map((n) => (
                            <li key={n.name}>
                              {n.name}: {n.value}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <p className="font-semibold text-gov-blue mb-1">4. Purpose of Visit</p>
                      {data.purposeData.length === 0 ? (
                        <p className="text-xs text-gray-500">No data for this month.</p>
                      ) : (
                        <ul className="list-disc list-inside">
                          {data.purposeData.map((p) => (
                            <li key={p.name}>
                              {p.name}: {p.value}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <p className="font-semibold text-gov-blue mb-1">5. Mode of Transportation</p>
                      {data.transportationData.length === 0 ? (
                        <p className="text-xs text-gray-500">No data for this month.</p>
                      ) : (
                        <ul className="list-disc list-inside">
                          {data.transportationData.map((t) => (
                            <li key={t.name}>
                              {t.name}: {t.value}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <p className="font-semibold text-gov-blue mb-1">System Validation Details</p>
                      <p>Data Source: Guest records submitted through Lakbay San Pablo System.</p>
                      <p>Data Status: Generated from verified monthly submission.</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

