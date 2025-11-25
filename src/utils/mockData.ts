import { Trip, Vehicle, Driver } from "@/types/fleet";

const vehiclesData: Vehicle[] = [
  {
    license_plate: "11153104",
    vehicle_id: 3506257,
    vin: "3104631",
    nickname: "סקודה ביזנס",
    model_name: "קאמיק",
    make_name: "סקודה",
    model_year: "2024",
    color: "לבן",
    motion_status: "parking",
    telematics_units: [{ ip_address: "52.7.3.67" }],
  },
  {
    license_plate: "70806703",
    vehicle_id: 3506258,
    vin: "6703890",
    nickname: "טויוטה משרד",
    model_name: "קורולה",
    make_name: "טויוטה",
    model_year: "2023",
    color: "כסף",
    motion_status: "parking",
    telematics_units: [{ ip_address: "52.7.3.68" }],
  },
  {
    license_plate: "45789012",
    vehicle_id: 3506259,
    vin: "7890123",
    nickname: "יונדאי סדאן",
    model_name: "אלנטרה",
    make_name: "יונדאי",
    model_year: "2023",
    color: "שחור",
    motion_status: "parking",
    telematics_units: [{ ip_address: "52.7.3.69" }],
  },
  {
    license_plate: "89012345",
    vehicle_id: 3506260,
    vin: "0123456",
    nickname: "מרצדס מנהל",
    model_name: "C-Class",
    make_name: "מרצדס",
    model_year: "2024",
    color: "כחול",
    motion_status: "driving",
    telematics_units: [{ ip_address: "52.7.3.70" }],
  },
];

const locations = [
  {
    lat: 32.0628662109375,
    lon: 34.784568786621094,
    address: "פאול קור 24, תל אביב יפו",
  },
  {
    lat: 32.064924999999995,
    lon: 34.784982,
    address: "1274 21, תל אביב יפו",
  },
  {
    lat: 32.0853,
    lon: 34.7818,
    address: "דיזנגוף 50, תל אביב יפו",
  },
  {
    lat: 32.0739,
    lon: 34.7925,
    address: "רוטשילד 120, תל אביב יפו",
  },
];

function generateTrip(
  tripId: number,
  vehicle: Vehicle,
  driver: Driver | undefined,
  date: Date
): Trip {
  // Fallback driver if none provided
  const fallbackDriver = {
    driver_id: 0,
    first_name: "Unknown",
    last_name: "Driver",
    driver_code: 0,
    managed_code: 0,
  };
  
  const driverData = driver || fallbackDriver;
  const startTime = new Date(date);
  startTime.setHours(8 + Math.floor(Math.random() * 10));
  startTime.setMinutes(Math.floor(Math.random() * 60));

  const durationMinutes = 15 + Math.floor(Math.random() * 120);
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  const distance = Math.random() * 50 + 5;
  const idleDuration = Math.floor(Math.random() * (durationMinutes * 0.3));

  const startLoc = locations[Math.floor(Math.random() * locations.length)];
  const endLoc = locations[Math.floor(Math.random() * locations.length)];

  return {
    trip_id: tripId,
    license_plate: vehicle.license_plate,
    driver_code: driverData.driver_code,
    driver_name: `${driverData.first_name} ${driverData.last_name}`,
    driver_source: 0,
    start_location: {
      location: {
        point: { lat: startLoc.lat, lon: startLoc.lon },
        address: { location: startLoc.address, speedlimit: 50 },
      },
      odometer: 7000 + Math.random() * 1000,
      timestamp: startTime.toISOString(),
    },
    end_location: {
      location: {
        point: { lat: endLoc.lat, lon: endLoc.lon },
        address: { location: endLoc.address },
      },
      odometer: 7000 + distance + Math.random() * 1000,
      timestamp: endTime.toISOString(),
    },
    duration_in_seconds: durationMinutes * 60,
    distance: distance,
    max_speed: 60 + Math.floor(Math.random() * 60),
    idle_duration_in_minutes: idleDuration,
    safety: {
      safety_grade: 70 + Math.random() * 30,
      fuel_grade: 75 + Math.random() * 25,
      safety_events_count: Math.floor(Math.random() * 3),
    },
    trip_status: "trip_end",
  };
}

export function generateMockTrips(days: number = 30, drivers: Driver[] = []): Trip[] {
  const trips: Trip[] = [];
  let tripIdCounter = 10034010074943;

  for (let d = 0; d < days; d++) {
    const date = new Date();
    date.setDate(date.getDate() - d);

    vehiclesData.forEach((vehicle) => {
      const numTrips = Math.floor(Math.random() * 5) + 1;
      for (let t = 0; t < numTrips; t++) {
        const driver = drivers.length > 0 
          ? drivers[Math.floor(Math.random() * drivers.length)]
          : undefined;
        trips.push(generateTrip(tripIdCounter++, vehicle, driver, date));
      }
    });
  }

  return trips;
}

export function getMockVehicles(): Vehicle[] {
  return vehiclesData;
}
