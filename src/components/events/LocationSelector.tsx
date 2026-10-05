import React, { useEffect, useState, useCallback } from 'react';
import { locationService } from '../../services/locationService';
import { useToast } from '../../context/ToastContext';
import { Location } from '../../types';
import Label from '../form/Label';

interface LocationSelectorProps {
  value?: string; // locationId or venue text
  venueText?: string;
  disabled?: boolean;
  eventCapacity?: number | string;
  onChange: (locationId: string, venueName: string, locationCapacity: number) => void;
}

export default function LocationSelector({
  value,
  venueText,
  disabled = false,
  eventCapacity,
  onChange,
}: LocationSelectorProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocId, setSelectedLocId] = useState<string>(value || '');
  const [selectedLocCapacity, setSelectedLocCapacity] = useState<number>(0);

  // Request Location Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqName, setReqName] = useState('');
  const [reqBuilding, setReqBuilding] = useState('');
  const [reqFloor, setReqFloor] = useState('');
  const [reqRoom, setReqRoom] = useState('');
  const [reqCapacity, setReqCapacity] = useState(100);
  const [reqDesc, setReqDesc] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);

  const { showToast } = useToast();

  const loadActiveLocations = useCallback(async () => {
    try {
      const data = await locationService.getLocations({ status: 'active' });
      setLocations(data.locations);

      // Match selected location if value is passed
      if (value) {
        const match = data.locations.find(
          (l) => l._id === value || l.name.toLowerCase() === (venueText || value).toLowerCase()
        );
        if (match) {
          setSelectedLocId(match._id);
          setSelectedLocCapacity(match.capacity);
        }
      }
    } catch {
      // Quiet fail
    } finally {
      setLoading(false);
    }
  }, [value, venueText]);

  useEffect(() => {
    loadActiveLocations();
  }, [loadActiveLocations]);

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locId = e.target.value;
    setSelectedLocId(locId);

    const found = locations.find((l) => l._id === locId);
    if (found) {
      setSelectedLocCapacity(found.capacity);
      const venueStr = `${found.name} (${found.building}, Rm ${found.room})`;
      onChange(found._id, venueStr, found.capacity);
    } else {
      setSelectedLocCapacity(0);
      onChange('', '', 0);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqName.trim() || !reqBuilding.trim() || !reqRoom.trim() || reqCapacity <= 0) {
      showToast('Please fill out all required location details.', 'error');
      return;
    }

    setSubmittingReq(true);
    try {
      await locationService.createLocation({
        name: reqName.trim(),
        building: reqBuilding.trim(),
        floor: reqFloor.trim(),
        room: reqRoom.trim(),
        capacity: Number(reqCapacity),
        description: reqDesc.trim(),
      });
      showToast('Location request submitted successfully! Awaiting administrator approval.', 'success');
      setShowRequestModal(false);
      setReqName('');
      setReqBuilding('');
      setReqFloor('');
      setReqRoom('');
      setReqCapacity(100);
      setReqDesc('');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(errorObj.response?.data?.message || errorObj.message || 'Request failed', 'error');
    } finally {
      setSubmittingReq(false);
    }
  };

  const capacityExceeded =
    eventCapacity && selectedLocCapacity > 0 && Number(eventCapacity) > selectedLocCapacity;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>
          Approved Campus Location <span className="text-error-500">*</span>
        </Label>
        {!disabled && (
          <button
            type="button"
            onClick={() => setShowRequestModal(true)}
            className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>+</span> Request New Location
          </button>
        )}
      </div>

      <div className="relative">
        <select
          value={selectedLocId}
          disabled={disabled || loading}
          onChange={handleSelect}
          className={`h-11 w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white disabled:opacity-50 ${
            capacityExceeded ? 'border-rose-400 dark:border-rose-500' : 'border-gray-300'
          }`}
          required
        >
          <option value="" disabled>
            {loading ? 'Loading approved campus locations...' : 'Select an approved location...'}
          </option>

          {/* Legacy venue option if not in location list */}
          {venueText && !locations.some((l) => l._id === selectedLocId) && (
            <option value={selectedLocId || 'legacy'}>
              [Legacy Venue] {venueText}
            </option>
          )}

          {locations.map((loc) => (
            <option key={loc._id} value={loc._id} className="dark:bg-gray-800">
              {loc.name} ({loc.building}, Rm {loc.room}) — Max {loc.capacity} seats ({loc.accessType})
            </option>
          ))}
        </select>
      </div>

      {/* Capacity feedback badge */}
      {selectedLocCapacity > 0 && (
        <div className="flex items-center justify-between text-[11px] pt-1">
          <span className="text-gray-500 dark:text-gray-400">
            Location Limit: <strong className="text-gray-800 dark:text-gray-200">{selectedLocCapacity} seats</strong>
          </span>
          {capacityExceeded && (
            <span className="font-bold text-rose-600 dark:text-rose-400">
              ⚠️ Event capacity exceeds location limit!
            </span>
          )}
        </div>
      )}

      {/* Request Location Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Request New Campus Location
              </h3>
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Submit venue details for administrative verification. Once approved by the administrator, it will be available for scheduling.
            </p>

            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div>
                <Label>Location / Venue Name *</Label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IoT Innovation Lab"
                  value={reqName}
                  onChange={(e) => setReqName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2.5 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Building *</Label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramanujan Block"
                    value={reqBuilding}
                    onChange={(e) => setReqBuilding(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2.5 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <Label>Floor</Label>
                  <input
                    type="text"
                    placeholder="e.g. 1st Floor"
                    value={reqFloor}
                    onChange={(e) => setReqFloor(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2.5 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Room Designation *</Label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room 108"
                    value={reqRoom}
                    onChange={(e) => setReqRoom(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2.5 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <Label>Maximum Capacity *</Label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={reqCapacity}
                    onChange={(e) => setReqCapacity(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2.5 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <Label>Facilities / Equipment</Label>
                <textarea
                  rows={2}
                  placeholder="Smart display, microphones, LAN ports..."
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2.5 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReq}
                  className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md shadow-brand-500/20 cursor-pointer disabled:opacity-50"
                >
                  {submittingReq ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
