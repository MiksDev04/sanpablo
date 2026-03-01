import { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Search, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { nationalities } from '../../data/dummyData';
import type { AgeGroup, Gender, TransportationMode, PurposeOfVisit, GuestRecord } from '../../types';

function differenceInDays(dateLeft: Date, dateRight: Date): number {
  const msPerDay = 86_400_000;
  return Math.round((dateRight.getTime() - dateLeft.getTime()) / msPerDay);
}

const subgroupSchema = z.object({
  nationality: z.string().min(1, 'Required'),
  gender: z.enum(['male', 'female', 'lgbt', 'prefer_not_to_say']),
  age: z.enum(['1-9', '10-17', '18-25', '26-35', '36-45', '46-55', '56+', 'prefer_not_to_say']),
  count: z.number().min(1, 'Min 1'),
});

const schema = z.object({
  checkIn: z.string().min(1, 'Check-in date required'),
  checkOut: z.string().min(1, 'Check-out date required'),
  subgroups: z.array(subgroupSchema).min(1, 'Add at least one guest subgroup'),
  transportationMode: z.enum(['private_car', 'bus', 'van', 'motorcycle', 'plane', 'other']),
  purpose: z.enum(['leisure', 'business', 'event', 'others']),
}).refine((data) => {
  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);
  return checkOut >= checkIn;
}, { message: 'Check-out must be on or after check-in', path: ['checkOut'] }).refine((data) => {
  const total = data.subgroups.reduce((s, g) => s + g.count, 0);
  return total > 0;
}, { message: 'Total guests must be greater than 0', path: ['subgroups'] });

type FormData = z.infer<typeof schema>;

const ageOptions: AgeGroup[] = ['1-9', '10-17', '18-25', '26-35', '36-45', '46-55', '56+', 'prefer_not_to_say'];
const genderOptions: Gender[] = ['male', 'female', 'lgbt', 'prefer_not_to_say'];
const transportOptions: { value: TransportationMode; label: string }[] = [
  { value: 'private_car', label: 'Private Car' },
  { value: 'bus', label: 'Bus' },
  { value: 'van', label: 'Van' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'plane', label: 'Plane' },
  { value: 'other', label: 'Other' },
];
const purposeOptions: { value: PurposeOfVisit; label: string }[] = [
  { value: 'leisure', label: 'Leisure' },
  { value: 'business', label: 'Business' },
  { value: 'event', label: 'Event' },
  { value: 'others', label: 'Others' },
];

const transportLabel: Record<string, string> = {
  private_car: 'Private Car',
  bus: 'Bus',
  van: 'Van',
  motorcycle: 'Motorcycle',
  plane: 'Plane',
  other: 'Other',
};

function GuestEntryForm({
  businessId,
  addGuestRecords,
  onSuccess,
  onCancel,
}: {
  businessId: string;
  addGuestRecords: (records: Omit<import('../../types').GuestRecord, 'id' | 'createdAt'>[]) => void;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      checkIn: new Date().toISOString().split('T')[0],
      checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      subgroups: [{ nationality: 'Philippines', gender: 'male', age: '18-25', count: 1 }],
      transportationMode: 'private_car',
      purpose: 'leisure',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'subgroups' });
  const subgroups = watch('subgroups');
  const totalGuests = subgroups?.reduce((s, g) => s + (g.count || 0), 0) ?? 0;
  const checkIn = watch('checkIn');
  const checkOut = watch('checkOut');
  const lengthOfStay = checkIn && checkOut
    ? Math.max(0, differenceInDays(new Date(checkIn), new Date(checkOut)))
    : 0;

  const onSubmit = (data: FormData) => {
    const records = data.subgroups.map((g) => ({
      businessId,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      nationality: g.nationality,
      gender: g.gender,
      age: g.age,
      transportationMode: data.transportationMode,
      purpose: data.purpose,
      numberOfGuests: g.count,
    }));
    addGuestRecords(records);
    onSuccess();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gov-blue">New Guest Entry</h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
        >
          <X size={20} />
        </button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Check-in *</label>
            <input type="date" {...register('checkIn')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            {errors.checkIn && <p className="text-red-600 text-sm mt-1">{errors.checkIn.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Check-out *</label>
            <input type="date" {...register('checkOut')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            {errors.checkOut && <p className="text-red-600 text-sm mt-1">{errors.checkOut.message}</p>}
          </div>
        </div>
        <div className="bg-primary-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gov-blue">Length of Stay: {lengthOfStay} night(s)</p>
        </div>
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gov-blue">Guest Subgroups</h3>
            <p className="text-sm text-gray-500">Total: <strong>{totalGuests}</strong></p>
          </div>
          {fields.map((field, index) => (
            <div key={field.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 flex flex-col sm:flex-row sm:items-end gap-4 flex-wrap">
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs text-gray-500 mb-1">Nationality</label>
                <select {...register(`subgroups.${index}.nationality`)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  {nationalities.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="w-24 min-w-[80px]">
                <label className="block text-xs text-gray-500 mb-1">Gender</label>
                <select {...register(`subgroups.${index}.gender`)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  {genderOptions.map((g) => (
                    <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="w-28 min-w-[90px]">
                <label className="block text-xs text-gray-500 mb-1">Age Group</label>
                <select {...register(`subgroups.${index}.age`)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  {ageOptions.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div className="w-20 min-w-[60px]">
                <label className="block text-xs text-gray-500 mb-1">Count</label>
                <input type="number" min={1} {...register(`subgroups.${index}.count`, { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <button type="button" onClick={() => remove(index)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {errors.subgroups?.root && <p className="text-red-600 text-sm mb-2">{errors.subgroups.root.message}</p>}
          <button
            type="button"
            onClick={() => append({ nationality: 'Philippines', gender: 'male', age: '18-25', count: 1 })}
            className="flex items-center gap-2 px-4 py-2 text-primary-600 border border-primary-300 rounded-lg hover:bg-primary-50 transition-colors text-sm"
          >
            <Plus size={18} /> Add Subgroup
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mode of Transportation *</label>
          <select {...register('transportationMode')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
            {transportOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Visit *</label>
          <select {...register('purpose')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
            {purposeOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="flex-1 py-3 bg-gov-blue text-white rounded-lg font-medium hover:bg-gov-blue/90 transition-colors">
            Save Guest Record
          </button>
          <button type="button" onClick={onCancel} className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function GuestDataEntry() {
  const { user } = useAuth();
  const { guestRecords, addGuestRecords } = useData();
  const businessId = user?.business?.id ?? 'biz-1';

  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    nationality: '',
    purpose: '',
    transport: '',
  });

  const records = useMemo(() => {
    return guestRecords
      .filter((r: GuestRecord) => r.businessId === businessId)
      .filter((r: GuestRecord) => {
        if (filters.dateFrom && r.checkIn < filters.dateFrom) return false;
        if (filters.dateTo && r.checkOut > filters.dateTo) return false;
        if (filters.nationality && r.nationality !== filters.nationality) return false;
        if (filters.purpose && r.purpose !== filters.purpose) return false;
        if (filters.transport && r.transportationMode !== filters.transport) return false;
        return true;
      })
      .sort((a: GuestRecord, b: GuestRecord) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());
  }, [businessId, filters, guestRecords]);

  const resetFilters = () => {
    setFilters({ dateFrom: '', dateTo: '', nationality: '', purpose: '', transport: '' });
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gov-blue">Guest Records</h1>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gov-blue text-white rounded-lg font-medium hover:bg-gov-blue/90 transition-colors w-fit"
        >
          <Plus size={20} /> Create New Guest Entry
        </button>
      </div>

      {showForm && (
        <GuestEntryForm
          businessId={businessId}
          addGuestRecords={addGuestRecords}
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <Search size={18} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Check-in From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Check-out To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nationality</label>
              <select
                value={filters.nationality}
                onChange={(e) => setFilters((f) => ({ ...f, nationality: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All</option>
                {nationalities.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Purpose</label>
              <select
                value={filters.purpose}
                onChange={(e) => setFilters((f) => ({ ...f, purpose: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All</option>
                {purposeOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Transportation</label>
              <select
                value={filters.transport}
                onChange={(e) => setFilters((f) => ({ ...f, transport: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All</option>
                {transportOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gov-blue text-white">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Check-in</th>
                <th className="px-4 py-3 text-left font-medium">Check-out</th>
                <th className="px-4 py-3 text-left font-medium">Nationality</th>
                <th className="px-4 py-3 text-left font-medium">Gender</th>
                <th className="px-4 py-3 text-left font-medium">Age</th>
                <th className="px-4 py-3 text-left font-medium">Transport</th>
                <th className="px-4 py-3 text-left font-medium">Purpose</th>
                <th className="px-4 py-3 text-right font-medium">Guests</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    No guest records found. Click &quot;Create New Guest Entry&quot; to add one.
                  </td>
                </tr>
              ) : (
                records.map((r: GuestRecord) => (
                  <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">{r.checkIn}</td>
                    <td className="px-4 py-3">{r.checkOut}</td>
                    <td className="px-4 py-3">{r.nationality}</td>
                    <td className="px-4 py-3 capitalize">{r.gender}</td>
                    <td className="px-4 py-3">{r.age}</td>
                    <td className="px-4 py-3">{transportLabel[r.transportationMode] ?? r.transportationMode}</td>
                    <td className="px-4 py-3 capitalize">{r.purpose}</td>
                    <td className="px-4 py-3 text-right font-medium">{r.numberOfGuests}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {records.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
            Showing {records.length} record{records.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
