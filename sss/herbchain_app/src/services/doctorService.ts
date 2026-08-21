import { supabase } from '@/lib/supabase';

export interface AyurvedicDoctor {
  id: string;
  registrationNo: string | null;
  doctorName: string;
  district: string;
  qualification: string | null;
  registeredAddress: string | null;
  clinicHospitalName: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface NearbyDoctor extends AyurvedicDoctor {
  distanceKm: number;
}

function mapRow(row: any): AyurvedicDoctor {
  return {
    id: row.id,
    registrationNo: row.registration_no,
    doctorName: row.doctor_name,
    district: row.district,
    qualification: row.qualification,
    registeredAddress: row.registered_address,
    clinicHospitalName: row.clinic_hospital_name,
    phone: row.phone,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
  };
}

const SELECT_FIELDS =
  'id, registration_no, doctor_name, district, qualification, registered_address, clinic_hospital_name, phone, latitude, longitude';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const doctorService = {
  /**
   * Up to `limit` doctors nearest to the given point, by real Haversine
   * distance. The full table is small (~540 rows), so it's cheaper and
   * simpler to fetch everything with coordinates and sort client-side than
   * to add a PostGIS/earthdistance extension for this dataset size.
   */
  async findNearest(latitude: number, longitude: number, limit = 5): Promise<NearbyDoctor[]> {
    const { data, error } = await supabase
      .from('ayurvedic_doctors')
      .select(SELECT_FIELDS)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);
    if (error) throw error;

    return (data ?? [])
      .map(mapRow)
      .map((d) => ({ ...d, distanceKm: Math.round(haversineKm(latitude, longitude, d.latitude!, d.longitude!) * 10) / 10 }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);
  },

  /** Fallback when location isn't available — any 5 doctors, so the portal is never empty. */
  async findAny(): Promise<AyurvedicDoctor[]> {
    const { data, error } = await supabase.from('ayurvedic_doctors').select(SELECT_FIELDS).limit(5);
    if (error) throw error;
    return (data ?? []).map(mapRow);
  },

  async getById(id: string): Promise<AyurvedicDoctor | null> {
    const { data, error } = await supabase.from('ayurvedic_doctors').select(SELECT_FIELDS).eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapRow(data) : null;
  },
};
