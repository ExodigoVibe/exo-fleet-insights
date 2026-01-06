-- Enable realtime for vehicle_assignments table
ALTER TABLE public.vehicle_assignments REPLICA IDENTITY FULL;