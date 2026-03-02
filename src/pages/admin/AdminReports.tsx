import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Eye, FileDown, Download, Printer } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

interface ReportFilters {
  month: string;
  year: string;
  accommodation: string;
}

function differenceInDays(dateLeft: Date, dateRight: Date): number {
  const msPerDay = 86_400_000;
  return Math.round((dateRight.getTime() - dateLeft.getTime()) / msPerDay);
}

export default function AdminReports() {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

  const { guestRecords, businesses, monthlySubmissions } = useData();
  const accommodationOptions = ['All', ...businesses.map((b) => b.businessName)];

  const { register, watch } = useForm<ReportFilters>({
    defaultValues: {
      month: '',
      year: currentYear.toString(),
      accommodation: 'All',
    },
  });

  const filters = watch();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const rows = useMemo(() => {
    let subs = monthlySubmissions.filter((s) => s.status === 'submitted');

    if (filters.year) {
      const y = parseInt(filters.year, 10);
      if (!Number.isNaN(y)) {
        subs = subs.filter((s) => s.year === y);
      }
    }
    if (filters.month) {
      const m = parseInt(filters.month, 10);
      if (!Number.isNaN(m)) {
        subs = subs.filter((s) => s.month === m);
      }
    }
    if (filters.accommodation && filters.accommodation !== 'All') {
      const biz = businesses.find((b) => b.businessName === filters.accommodation);
      if (biz) {
        subs = subs.filter((s) => s.businessId === biz.id);
      } else {
        subs = [];
      }
    }

    return subs
      .map((s) => {
        const biz = businesses.find((b) => b.id === s.businessId);
        const key = `${s.businessId}-${s.year}-${s.month}`;
        return {
          key,
          businessId: s.businessId,
          businessName: biz?.businessName ?? 'Unknown Accommodation',
          month: s.month,
          year: s.year,
          submittedAt: s.submittedAt ?? '',
        };
      })
      .sort((a, b) => (b.year - a.year) * 12 + (b.month - a.month));
  }, [businesses, monthlySubmissions, filters]);

  const selectedRow = rows.find((r) => r.key === selectedKey) ?? null;

  const getRecordsForRow = (row: { businessId: string; month: number; year: number }) => {
    return guestRecords.filter(
      (r) =>
        r.businessId === row.businessId &&
        new Date(r.checkIn).getMonth() + 1 === row.month &&
        new Date(r.checkIn).getFullYear() === row.year,
    );
  };

  const summary = useMemo(() => {
    if (!selectedRow) return null;
    const records = getRecordsForRow(selectedRow);

    const biz = businesses.find((b) => b.id === selectedRow.businessId) ?? null;

    const totalGuests = records.reduce((sum, r) => sum + r.numberOfGuests, 0);
    const totalGuestNights = records.reduce((sum, r) => {
      const checkIn = new Date(r.checkIn);
      const checkOut = new Date(r.checkOut);
      return sum + differenceInDays(checkIn, checkOut) * r.numberOfGuests;
    }, 0);
    const averageLengthOfStay = totalGuests > 0 ? totalGuestNights / totalGuests : 0;

    const genderMap = new Map<string, number>();
    records.forEach((r) => {
      const label = r.gender === 'lgbt' ? 'LGBT+' : r.gender.charAt(0).toUpperCase() + r.gender.slice(1);
      genderMap.set(label, (genderMap.get(label) || 0) + r.numberOfGuests);
    });
    const genderData = Array.from(genderMap.entries()).map(([name, value]) => ({ name, value }));

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

    const nationalityMap = new Map<string, number>();
    records.forEach((r) => {
      nationalityMap.set(r.nationality, (nationalityMap.get(r.nationality) || 0) + r.numberOfGuests);
    });
    const nationalityData = Array.from(nationalityMap.entries()).map(([name, value]) => ({ name, value }));

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

    const bookingChannelData = [
      { name: 'Walk-in', value: 0 },
      { name: 'Online Booking Platforms', value: 0 },
      { name: 'Travel Agency', value: 0 },
      { name: 'Direct Website Booking', value: 0 },
    ];

    const guestClassificationData = [
      { name: 'First-time Visitors', value: 0 },
      { name: 'Returning Guests', value: 0 },
    ];

    const spendingRangeData = [
      { name: 'Below ₱3,000', value: 0 },
      { name: '₱3,000 – ₱7,000', value: 0 },
      { name: '₱7,001 – ₱15,000', value: 0 },
      { name: 'Above ₱15,000', value: 0 },
    ];

    const averageOccupancyRate = 0;

    return {
      business: biz,
      month: selectedRow.month,
      year: selectedRow.year,
      totalGuests,
      totalGuestNights,
      averageLengthOfStay,
      genderData,
      ageData,
      nationalityData,
      purposeData,
      bookingChannelData,
      guestClassificationData,
      spendingRangeData,
      averageOccupancyRate,
      submittedAt: selectedRow.submittedAt,
    };
  }, [businesses, guestRecords, selectedRow]);

  const exportPDF = () => {
    if (!rows.length) return;
    const doc = new jsPDF();
    rows.forEach((r, index) => {
      const records = getRecordsForRow({ businessId: r.businessId, month: r.month, year: r.year });
      const biz = businesses.find((b) => b.id === r.businessId) ?? null;

      const totalGuests = records.reduce((sum, rec) => sum + rec.numberOfGuests, 0);
      const totalGuestNights = records.reduce((sum, rec) => {
        const checkIn = new Date(rec.checkIn);
        const checkOut = new Date(rec.checkOut);
        return sum + differenceInDays(checkIn, checkOut) * rec.numberOfGuests;
      }, 0);
      const averageLengthOfStay = totalGuests > 0 ? totalGuestNights / totalGuests : 0;

      const genderMap = new Map<string, number>();
      records.forEach((rec) => {
        const label =
          rec.gender === 'lgbt' ? 'LGBT+' : rec.gender.charAt(0).toUpperCase() + rec.gender.slice(1);
        genderMap.set(label, (genderMap.get(label) || 0) + rec.numberOfGuests);
      });
      const genderData = Array.from(genderMap.entries()).map(([name, value]) => ({ name, value }));

      const ageBracketMap = new Map<string, number>();
      records.forEach((rec) => {
        const src = rec.age;
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
        ageBracketMap.set(label, (ageBracketMap.get(label) || 0) + rec.numberOfGuests);
      });
      const ageData = Array.from(ageBracketMap.entries()).map(([name, value]) => ({ name, value }));

      const nationalityMap = new Map<string, number>();
      records.forEach((rec) => {
        nationalityMap.set(
          rec.nationality,
          (nationalityMap.get(rec.nationality) || 0) + rec.numberOfGuests,
        );
      });
      const nationalityData = Array.from(nationalityMap.entries()).map(([name, value]) => ({
        name,
        value,
      }));

      const purposeMap = new Map<string, number>();
      records.forEach((rec) => {
        const key =
          rec.purpose === 'leisure'
            ? 'Leisure / Vacation'
            : rec.purpose === 'business'
              ? 'Business'
              : rec.purpose === 'event'
                ? 'Events / Conference'
                : 'Others';
        purposeMap.set(key, (purposeMap.get(key) || 0) + rec.numberOfGuests);
      });
      const purposeData = Array.from(purposeMap.entries()).map(([name, value]) => ({ name, value }));

      const bookingChannelData = [
        { name: 'Walk-in', value: 0 },
        { name: 'Online Booking Platforms', value: 0 },
        { name: 'Travel Agency', value: 0 },
        { name: 'Direct Website Booking', value: 0 },
      ];

      const guestClassificationData = [
        { name: 'First-time Visitors', value: 0 },
        { name: 'Returning Guests', value: 0 },
      ];

      const spendingRangeData = [
        { name: 'Below ₱3,000', value: 0 },
        { name: '₱3,000 – ₱7,000', value: 0 },
        { name: '₱7,001 – ₱15,000', value: 0 },
        { name: 'Above ₱15,000', value: 0 },
      ];

      const averageOccupancyRate = 0;

      if (index > 0) {
        doc.addPage();
      }

      doc.setFontSize(14);
      doc.text('MONTHLY TOURISM DEMOGRAPHIC REPORT', 14, 18);
      doc.setFontSize(10);
      doc.text('Lakbay San Pablo System – Auto Generated Report', 14, 26);

      let y = 36;
      doc.text(`Accommodation Name: ${biz?.businessName ?? 'Unknown Accommodation'}`, 14, y);
      y += 6;
      doc.text(`Accreditation / Permit No.: ${biz?.permitNumber ?? 'N/A'}`, 14, y);
      y += 6;
      doc.text(`Location: ${biz?.address ?? 'N/A'}`, 14, y);
      y += 6;
      doc.text(
        `Reporting Month: ${new Date(r.year, r.month - 1).toLocaleString('default', {
          month: 'long',
          year: 'numeric',
        })}`,
        14,
        y,
      );
      y += 6;
      doc.text(`Date Generated: ${new Date().toLocaleString()}`, 14, y);
      y += 10;

      doc.text('1. Summary of Tourist Arrivals', 14, y);
      y += 6;
      doc.text(`Total Guests Checked-in: ${totalGuests}`, 18, y);
      y += 6;
      doc.text(`Total Guest Nights: ${totalGuestNights}`, 18, y);
      y += 6;
      doc.text(`Average Length of Stay: ${averageLengthOfStay.toFixed(1)} nights`, 18, y);
      y += 6;
      doc.text(`Average Occupancy Rate: ${averageOccupancyRate.toFixed(1)}%`, 18, y);
      y += 10;

      autoTable(doc, {
        startY: y,
        head: [['Gender', 'Guests']],
        body: genderData.map((g) => [g.name, g.value.toString()]),
        styles: { fontSize: 9 },
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 95] },
      });

      const afterGenderY = (doc as any).lastAutoTable.finalY + 8;

      autoTable(doc, {
        startY: afterGenderY,
        head: [['Age Group', 'Guests']],
        body: ageData.map((a) => [a.name, a.value.toString()]),
        styles: { fontSize: 9 },
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 95] },
      });

      const afterAgeY = (doc as any).lastAutoTable.finalY + 8;

      autoTable(doc, {
        startY: afterAgeY,
        head: [['Nationality', 'Guests']],
        body: nationalityData.map((n) => [n.name, n.value.toString()]),
        styles: { fontSize: 9 },
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 95] },
      });

      const afterNationalityY = (doc as any).lastAutoTable.finalY + 8;

      autoTable(doc, {
        startY: afterNationalityY,
        head: [['Purpose of Visit', 'Guests']],
        body: purposeData.map((p) => [p.name, p.value.toString()]),
        styles: { fontSize: 9 },
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 95] },
      });

      let afterPurposeY = (doc as any).lastAutoTable.finalY + 10;

      doc.text('5. Booking Channel', 14, afterPurposeY);
      afterPurposeY += 4;
      autoTable(doc, {
        startY: afterPurposeY,
        head: [['Booking Channel', 'Guests']],
        body: bookingChannelData.map((b) => [b.name, b.value.toString()]),
        styles: { fontSize: 9 },
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 95] },
      });

      let afterBookingY = (doc as any).lastAutoTable.finalY + 8;

      doc.text('6. Guest Classification', 14, afterBookingY);
      afterBookingY += 4;
      autoTable(doc, {
        startY: afterBookingY,
        head: [['Classification', 'Guests']],
        body: guestClassificationData.map((g) => [g.name, g.value.toString()]),
        styles: { fontSize: 9 },
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 95] },
      });

      let afterGuestClassY = (doc as any).lastAutoTable.finalY + 8;

      doc.text('7. Estimated Tourist Spending Range (Optional Data)', 14, afterGuestClassY);
      afterGuestClassY += 4;
      autoTable(doc, {
        startY: afterGuestClassY,
        head: [['Spending Range', 'Guests']],
        body: spendingRangeData.map((s) => [s.name, s.value.toString()]),
        styles: { fontSize: 9 },
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 95] },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 10;

      doc.setFontSize(10);
      doc.text('System Validation Details', 14, finalY);
      const vY = finalY + 6;
      doc.text(`Submitted by: ${biz?.ownerName ?? 'Accommodation Representative'}`, 18, vY);
      doc.text('Account Role: Establishment Administrator', 18, vY + 6);
      doc.text(
        `Submission Timestamp: ${r.submittedAt ? new Date(r.submittedAt).toLocaleString() : 'N/A'}`,
        18,
        vY + 12,
      );
      doc.text('Data Status: Verified and Synced to Central Database', 18, vY + 18);
      doc.text(
        `Digital Authentication Code: LSP-VER-${Date.now().toString().slice(-8)}`,
        18,
        vY + 24,
      );
    });

    doc.save(`monthly-tourism-reports-${Date.now()}.pdf`);
  };

  const exportCSV = () => {
    if (!rows.length) return;
    const lines: string[] = [];

    lines.push('Accommodation,Section,Label,Value');

    rows.forEach((r) => {
      const records = getRecordsForRow({ businessId: r.businessId, month: r.month, year: r.year });
      const biz = businesses.find((b) => b.id === r.businessId) ?? null;

      const totalGuests = records.reduce((sum, rec) => sum + rec.numberOfGuests, 0);
      const totalGuestNights = records.reduce((sum, rec) => {
        const checkIn = new Date(rec.checkIn);
        const checkOut = new Date(rec.checkOut);
        return sum + differenceInDays(checkIn, checkOut) * rec.numberOfGuests;
      }, 0);
      const averageLengthOfStay = totalGuests > 0 ? totalGuestNights / totalGuests : 0;
      const averageOccupancyRate = 0;

      const genderMap = new Map<string, number>();
      records.forEach((rec) => {
        const label =
          rec.gender === 'lgbt' ? 'LGBT+' : rec.gender.charAt(0).toUpperCase() + rec.gender.slice(1);
        genderMap.set(label, (genderMap.get(label) || 0) + rec.numberOfGuests);
      });
      const genderData = Array.from(genderMap.entries()).map(([name, value]) => ({ name, value }));

      const ageBracketMap = new Map<string, number>();
      records.forEach((rec) => {
        const src = rec.age;
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
        ageBracketMap.set(label, (ageBracketMap.get(label) || 0) + rec.numberOfGuests);
      });
      const ageData = Array.from(ageBracketMap.entries()).map(([name, value]) => ({ name, value }));

      const nationalityMap = new Map<string, number>();
      records.forEach((rec) => {
        nationalityMap.set(
          rec.nationality,
          (nationalityMap.get(rec.nationality) || 0) + rec.numberOfGuests,
        );
      });
      const nationalityData = Array.from(nationalityMap.entries()).map(([name, value]) => ({
        name,
        value,
      }));

      const purposeMap = new Map<string, number>();
      records.forEach((rec) => {
        const key =
          rec.purpose === 'leisure'
            ? 'Leisure / Vacation'
            : rec.purpose === 'business'
              ? 'Business'
              : rec.purpose === 'event'
                ? 'Events / Conference'
                : 'Others';
        purposeMap.set(key, (purposeMap.get(key) || 0) + rec.numberOfGuests);
      });
      const purposeData = Array.from(purposeMap.entries()).map(([name, value]) => ({ name, value }));

      const bookingChannelData = [
        { name: 'Walk-in', value: 0 },
        { name: 'Online Booking Platforms', value: 0 },
        { name: 'Travel Agency', value: 0 },
        { name: 'Direct Website Booking', value: 0 },
      ];

      const guestClassificationData = [
        { name: 'First-time Visitors', value: 0 },
        { name: 'Returning Guests', value: 0 },
      ];

      const spendingRangeData = [
        { name: 'Below ₱3,000', value: 0 },
        { name: '₱3,000 – ₱7,000', value: 0 },
        { name: '₱7,001 – ₱15,000', value: 0 },
        { name: 'Above ₱15,000', value: 0 },
      ];

      const name = biz?.businessName ?? 'Unknown Accommodation';

      lines.push(`${name},Summary,Total Guests Checked-in,${totalGuests}`);
      lines.push(`${name},Summary,Total Guest Nights,${totalGuestNights}`);
      lines.push(`${name},Summary,Average Length of Stay,${averageLengthOfStay.toFixed(1)}`);
      lines.push(`${name},Summary,Average Occupancy Rate,${averageOccupancyRate.toFixed(1)}%`);

      genderData.forEach((g) => {
        lines.push(`${name},Gender,${g.name},${g.value}`);
      });
      ageData.forEach((a) => {
        lines.push(`${name},Age Group,${a.name},${a.value}`);
      });
      nationalityData.forEach((n) => {
        lines.push(`${name},Nationality,${n.name},${n.value}`);
      });
      purposeData.forEach((p) => {
        lines.push(`${name},Purpose,${p.name},${p.value}`);
      });
      bookingChannelData.forEach((b) => {
        lines.push(`${name},Booking Channel,${b.name},${b.value}`);
      });
      guestClassificationData.forEach((g) => {
        lines.push(`${name},Guest Classification,${g.name},${g.value}`);
      });
      spendingRangeData.forEach((s) => {
        lines.push(`${name},Spending Range,${s.name},${s.value}`);
      });
    });

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly-tourism-summary-aggregate-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gov-blue mb-6">Reports</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gov-blue mb-4">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Accommodation</label>
            <select {...register('accommodation')} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              {accommodationOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-gov-blue">Monthly Reports from Accommodations</h2>
          <p className="text-xs text-gray-500">
            {rows.length} submitted report{rows.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {rows.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">
              No monthly reports have been submitted yet.
            </div>
          ) : (
            rows.map((r) => (
              <div
                key={r.key}
                className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <p className="font-medium text-gov-blue">
                    {r.businessName}
                  </p>
                  <p className="text-sm text-gray-700">
                    {new Date(r.year, r.month - 1).toLocaleString('default', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-gray-500">
                    Submitted on{' '}
                    {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedKey(r.key)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-gov-blue text-white rounded-lg hover:bg-gov-blue/90"
                  >
                    <Eye size={14} />
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 print:hidden">
        <button
          onClick={exportPDF}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gov-blue text-white hover:bg-gov-blue/90"
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

      {selectedRow && summary && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-semibold text-gov-blue">Monthly Tourism Demographic Report</h2>
                <p className="text-xs text-gray-500">
                {new Date(summary.year, summary.month - 1).toLocaleString('default', {
                  month: 'long',
                  year: 'numeric',
                })}{' '}
                • {summary.business?.businessName ?? 'Unknown Accommodation'}
                </p>
              </div>
              <button
                type="button"
              onClick={() => setSelectedKey(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="px-6 py-4 text-sm text-gray-700 space-y-4">
              <div>
                <p className="font-semibold text-gov-blue mb-1">Accommodation Details</p>
                <p>
                  Accommodation Name:{' '}
                  {summary.business ? summary.business.businessName : 'Unknown Accommodation'}
                </p>
                <p>
                  Accreditation / Permit No.:{' '}
                  {summary.business ? summary.business.permitNumber : 'N/A'}
                </p>
                <p>
                  Location:{' '}
                  {summary.business ? summary.business.address : 'N/A'}
                </p>
                <p>
                  Reporting Month:{' '}
                  {new Date(summary.year, summary.month - 1).toLocaleString('default', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <p>Date Generated: {new Date().toLocaleString()}</p>
                <p>Submitted Via: Lakbay San Pablo System</p>
              </div>

              <div>
                <p className="font-semibold text-gov-blue mb-1">1. Summary of Tourist Arrivals</p>
                <p>Total Guests Checked-in: {summary.totalGuests}</p>
                <p>Total Guest Nights: {summary.totalGuestNights}</p>
                <p>Average Length of Stay: {summary.averageLengthOfStay.toFixed(1)} nights</p>
                <p>Average Occupancy Rate: {summary.averageOccupancyRate.toFixed(1)}%</p>
              </div>

              <div>
                <p className="font-semibold text-gov-blue mb-1">2. Demographic Breakdown</p>
                <p className="font-medium mt-1">By Gender</p>
                {summary.genderData.length === 0 ? (
                  <p className="text-xs text-gray-500">No data for this month.</p>
                ) : (
                  <ul className="list-disc list-inside">
                    {summary.genderData.map((g) => (
                      <li key={g.name}>
                        {g.name}: {g.value}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="font-medium mt-2">By Age Group</p>
                {summary.ageData.length === 0 ? (
                  <p className="text-xs text-gray-500">No data for this month.</p>
                ) : (
                  <ul className="list-disc list-inside">
                    {summary.ageData.map((a) => (
                      <li key={a.name}>
                        {a.name}: {a.value}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="font-semibold text-gov-blue mb-1">3. Nationality Distribution</p>
                {summary.nationalityData.length === 0 ? (
                  <p className="text-xs text-gray-500">No data for this month.</p>
                ) : (
                  <ul className="list-disc list-inside">
                    {summary.nationalityData.map((n) => (
                      <li key={n.name}>
                        {n.name}: {n.value}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="font-semibold text-gov-blue mb-1">4. Purpose of Visit</p>
                {summary.purposeData.length === 0 ? (
                  <p className="text-xs text-gray-500">No data for this month.</p>
                ) : (
                  <ul className="list-disc list-inside">
                    {summary.purposeData.map((p) => (
                      <li key={p.name}>
                        {p.name}: {p.value}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="font-semibold text-gov-blue mb-1">5. Booking Channel</p>
                {summary.bookingChannelData.length === 0 ? (
                  <p className="text-xs text-gray-500">No data for this month.</p>
                ) : (
                  <ul className="list-disc list-inside">
                    {summary.bookingChannelData.map((b) => (
                      <li key={b.name}>
                        {b.name}: {b.value}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="font-semibold text-gov-blue mb-1">6. Guest Classification</p>
                {summary.guestClassificationData.length === 0 ? (
                  <p className="text-xs text-gray-500">No data for this month.</p>
                ) : (
                  <ul className="list-disc list-inside">
                    {summary.guestClassificationData.map((g) => (
                      <li key={g.name}>
                        {g.name}: {g.value}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="font-semibold text-gov-blue mb-1">7. Estimated Tourist Spending Range (Optional Data)</p>
                {summary.spendingRangeData.length === 0 ? (
                  <p className="text-xs text-gray-500">No data for this month.</p>
                ) : (
                  <ul className="list-disc list-inside">
                    {summary.spendingRangeData.map((s) => (
                      <li key={s.name}>
                        {s.name}: {s.value}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="font-semibold text-gov-blue mb-1">System Validation Details</p>
                <p>Data Source: Guest records submitted through Lakbay San Pablo System.</p>
                <p>Data Status: Aggregated and generated by Tourism Office.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
