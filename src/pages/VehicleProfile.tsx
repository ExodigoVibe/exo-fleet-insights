import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Users, Gauge, Settings, Car, FileText, Wrench, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useVehiclesQuery } from "@/hooks/queries/useVehiclesQuery";
import { useDriversQuery } from "@/hooks/queries/useDriversQuery";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function VehicleProfile() {
  const { licensePlate } = useParams<{ licensePlate: string }>();
  const navigate = useNavigate();
  
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehiclesQuery();
  const { data: drivers = [], isLoading: driversLoading } = useDriversQuery();

  const [assignment, setAssignment] = useState("");
  const [mileage, setMileage] = useState("17000");
  const [status, setStatus] = useState("maintenance");
  const [nextServiceMileage, setNextServiceMileage] = useState("30000");

  const vehicle = vehicles.find((v) => v.license_plate === licensePlate);

  if (vehiclesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading vehicle details...</div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="space-y-6 p-8">
        <Button variant="outline" onClick={() => navigate("/vehicle-fleet")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Vehicle Fleet
        </Button>
        <div className="text-center text-muted-foreground">Vehicle not found</div>
      </div>
    );
  }

  const vehicleTitle = `${vehicle.make_name} ${vehicle.model_name}`;
  const assignedDriver = drivers.find((d) => d.driver_id.toString() === assignment);

  return (
    <div className="space-y-6 p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/vehicle-fleet")}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Vehicle Profile: {vehicleTitle}</h1>
      </div>

      {/* Top Section: Assignment, Mileage, Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Assignment */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-primary">
              <Users className="h-4 w-4" />
              Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={assignment} onValueChange={setAssignment}>
              <SelectTrigger>
                <SelectValue placeholder="Select driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.driver_id} value={driver.driver_id.toString()}>
                    {driver.first_name} {driver.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {assignedDriver && (
              <div className="bg-green-50 border border-green-200 rounded p-2 text-sm text-green-800">
                Assigned to: {assignedDriver.first_name} {assignedDriver.last_name}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mileage */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-primary">
              <Gauge className="h-4 w-4" />
              Mileage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <div className="text-4xl font-bold">{parseInt(mileage).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">kilometers</div>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                className="flex-1"
              />
              <Button>Update</Button>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-primary">
              <Settings className="h-4 w-4" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-center">
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Car Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Car Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Car Name</p>
              <p className="text-base font-semibold">{vehicleTitle}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">License Plate</p>
              <p className="text-base font-semibold">{vehicle.license_plate}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Model & Year</p>
              <p className="text-base font-semibold">
                {vehicle.model_name} {vehicle.model_year}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Arrival Date</p>
              <p className="text-base font-semibold">-</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Contract End</p>
              <p className="text-base font-semibold">-</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Monthly Cost</p>
              <p className="text-base font-semibold">$N/A</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Car Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Car Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Vehicle License */}
          <div className="space-y-3">
            <Label>Vehicle License</Label>
            <div className="flex gap-3">
              <Input type="file" className="flex-1" />
              <Input type="date" className="w-48" defaultValue="2025-08-28" />
            </div>
            <div className="text-sm text-red-600 flex items-center gap-2">
              <span>⚠</span>
              <span>Document has expired.</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="email-reminder-license" />
              <label htmlFor="email-reminder-license" className="text-sm">
                Email reminder 1 month before expiry
              </label>
            </div>
          </div>

          {/* Vehicle Insurance */}
          <div className="space-y-3">
            <Label>Vehicle Insurance</Label>
            <div className="flex gap-3">
              <Input type="file" className="flex-1" />
              <Input type="date" className="w-48" placeholder="dd/mm/yyyy" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="email-reminder-insurance" />
              <label htmlFor="email-reminder-insurance" className="text-sm">
                Email reminder 1 month before expiry
              </label>
            </div>
          </div>

          <Button className="w-full">Save Documents</Button>
        </CardContent>
      </Card>

      {/* Service Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Service Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Current Mileage</p>
              <p className="text-2xl font-bold">{parseInt(mileage).toLocaleString()} km</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Mileage to Next Service</p>
              <p className="text-2xl font-bold">13,000 km</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Last Service</p>
              <p className="text-2xl font-bold">N/A</p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Next Service Mileage</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={nextServiceMileage}
                onChange={(e) => setNextServiceMileage(e.target.value)}
                className="flex-1"
              />
              <Button>Set</Button>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="service-notification" />
              <label htmlFor="service-notification" className="text-sm">
                Email notification 1 month before service due
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Maintenance History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>End Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Sep 23, 2025</TableCell>
                <TableCell>
                  <Select defaultValue="routine">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input defaultValue="Maintenance event" />
                </TableCell>
                <TableCell>
                  <Input type="date" defaultValue="2025-09-27" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Aug 26, 2025</TableCell>
                <TableCell>
                  <Select defaultValue="routine">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input defaultValue="Vehicle entered maintenance - details to be update" />
                </TableCell>
                <TableCell>
                  <Input type="date" placeholder="dd/mm/yyyy" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Car History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Car History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Sep 24, 2025</TableCell>
                <TableCell>
                  <Badge variant="outline">Assignment</Badge>
                </TableCell>
                <TableCell>Assignment event</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Sep 23, 2025</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    Maintenance
                  </Badge>
                </TableCell>
                <TableCell>Maintenance event</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Sep 20, 2025</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Accident
                  </Badge>
                </TableCell>
                <TableCell>h</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Aug 26, 2025</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    Maintenance
                  </Badge>
                </TableCell>
                <TableCell>Vehicle entered maintenance - details to be updated</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
