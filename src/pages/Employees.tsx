import { useState, useMemo } from "react";
import { useDriversQuery } from "@/hooks/queries/useDriversQuery";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Search, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const Employees = () => {
  const { data: drivers, isLoading, error } = useDriversQuery();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDrivers = useMemo(() => {
    if (!drivers) return [];
    if (!searchTerm) return drivers;

    const search = searchTerm.toLowerCase();
    return drivers.filter((driver) => {
      const fullName = `${driver.first_name} ${driver.last_name}`.toLowerCase();
      const driverCode = driver.driver_code.toString();
      const email = driver.email?.toLowerCase() || "";
      const phone = driver.phone?.toLowerCase() || "";
      const cellular = driver.cellular?.toLowerCase() || "";

      return (
        fullName.includes(search) ||
        driverCode.includes(search) ||
        email.includes(search) ||
        phone.includes(search) ||
        cellular.includes(search)
      );
    });
  }, [drivers, searchTerm]);

  const handleExportToExcel = () => {
    if (!filteredDrivers.length) {
      toast.error("No data to export");
      return;
    }

    const exportData = filteredDrivers.map((driver) => ({
      "Driver ID": driver.driver_id,
      "Name": `${driver.first_name} ${driver.last_name}`,
      "Driver Code": driver.driver_code || "-",
      "Email": driver.email || "-",
      "Phone Number": driver.phone || driver.cellular || "-",
      "Status": driver.is_blocked ? "Blocked" : "Not Blocked",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

    XLSX.writeFile(workbook, `employees_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`Exported ${filteredDrivers.length} employees to Excel`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Employees</h1>
                <p className="text-muted-foreground mt-1">
                  Manage driver information and contacts
                </p>
              </div>
            </div>
            <Button
              onClick={handleExportToExcel}
              disabled={isLoading || !filteredDrivers.length}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export to Excel
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Drivers List</CardTitle>
            <CardDescription>
              {isLoading ? (
                "Loading drivers..."
              ) : error ? (
                <span className="text-destructive">Failed to load drivers</span>
              ) : (
                `Total: ${drivers?.length || 0} drivers${searchTerm ? ` (${filteredDrivers.length} matching)` : ""}`
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search employees by name, email, driver code, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8 text-muted-foreground">
                Failed to load drivers data
              </div>
            ) : filteredDrivers.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Driver ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Driver Code</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDrivers.map((driver) => (
                      <TableRow key={driver.driver_id}>
                        <TableCell className="font-medium">{driver.driver_id}</TableCell>
                        <TableCell>
                          {driver.first_name} {driver.last_name}
                        </TableCell>
                        <TableCell>{driver.driver_code || "-"}</TableCell>
                        <TableCell>{driver.email || "-"}</TableCell>
                        <TableCell>{driver.phone || driver.cellular || "-"}</TableCell>
                        <TableCell>
                          {driver.is_blocked ? (
                            <Badge variant="destructive">Blocked</Badge>
                          ) : (
                            <Badge variant="default" className="bg-green-600">Not Blocked</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : searchTerm ? (
              <div className="text-center py-8 text-muted-foreground">
                No drivers matching "{searchTerm}"
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No drivers found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Employees;
