import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDriversQuery } from '@/hooks/queries/useDriversQuery';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, Search, Download, UserCheck, UserX } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

const Employees = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: drivers, isLoading, error } = useDriversQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');

  const filteredDrivers = useMemo(() => {
    if (!drivers) return [];

    let filtered = drivers;

    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter((d) => !d.is_blocked);
    } else if (statusFilter === 'blocked') {
      filtered = filtered.filter((d) => d.is_blocked);
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((driver) => {
        const fullName = `${driver.first_name} ${driver.last_name}`.toLowerCase();
        const driverCode = driver.managed_code.toString();
        const email = driver.email?.toLowerCase() || '';
        const phone = driver.phone?.toLowerCase() || '';
        const cellular = driver.cellular?.toLowerCase() || '';

        return (
          fullName.includes(search) ||
          driverCode.includes(search) ||
          email.includes(search) ||
          phone.includes(search) ||
          cellular.includes(search)
        );
      });
    }

    return filtered;
  }, [drivers, searchTerm, statusFilter]);

  const handleExportToExcel = () => {
    if (!filteredDrivers.length) {
      toast.error(t('vehicles.noDataToExport'));
      return;
    }

    const exportData = filteredDrivers.map((driver) => ({
      'Driver ID': driver.driver_id,
      Name: `${driver.first_name} ${driver.last_name}`,
      'Driver Code': driver.managed_code || '-',
      Email: driver.email || '-',
      'Phone Number': driver.phone || driver.cellular || '-',
      Status: driver.is_blocked ? 'Blocked' : 'Not Blocked',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

    XLSX.writeFile(workbook, `employees_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(t('employees.exportSuccess', { count: filteredDrivers.length }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">{t('employees.title')}</h1>
              <p className="text-muted-foreground mt-1">{t('employees.subtitle')}</p>
            </div>
          </div>
          <Button
            onClick={handleExportToExcel}
            disabled={isLoading || !filteredDrivers.length}
            variant="outline"
            className="gap-2"
          >
            {t('common.excel')} <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'all' ? 'border-2 border-primary' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <CardContent className="pt-6 text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-3" />
              <div className="text-4xl font-bold mb-1">{drivers?.length || 0}</div>
              <div className="text-sm text-muted-foreground">{t('employees.totalEmployees')}</div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'active' ? 'border-2 border-primary' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            <CardContent className="pt-6 text-center">
              <UserCheck className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <div className="text-4xl font-bold text-green-600 mb-1">
                {drivers?.filter((d) => !d.is_blocked).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">{t('employees.activeDrivers')}</div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'blocked' ? 'border-2 border-primary' : ''}`}
            onClick={() => setStatusFilter('blocked')}
          >
            <CardContent className="pt-6 text-center">
              <UserX className="h-8 w-8 text-destructive mx-auto mb-3" />
              <div className="text-4xl font-bold text-destructive mb-1">
                {drivers?.filter((d) => d.is_blocked).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">{t('employees.blockedDrivers')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder={t('employees.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('employees.employeesList')} ({filteredDrivers.length})</CardTitle>
            <CardDescription>
              {isLoading ? (
                t('employees.loadingDrivers')
              ) : error ? (
                <span className="text-destructive">{t('employees.failedToLoad')}</span>
              ) : statusFilter !== 'all' ? (
                t('employees.showingDrivers', { filter: statusFilter })
              ) : (
                t('employees.totalDrivers', { count: drivers?.length || 0 })
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('employees.failedToLoad')}
              </div>
            ) : filteredDrivers.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('employees.driverId')}</TableHead>
                      <TableHead>{t('common.name')}</TableHead>
                      <TableHead>{t('employees.driverCode')}</TableHead>
                      <TableHead>{t('common.email')}</TableHead>
                      <TableHead>{t('employees.phoneNumber')}</TableHead>
                      <TableHead>{t('common.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDrivers.map((driver) => (
                      <TableRow
                        key={driver.driver_id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/employees/${driver.driver_id}`)}
                      >
                        <TableCell className="font-medium">{driver.driver_id}</TableCell>
                        <TableCell>
                          {driver.first_name} {driver.last_name}
                        </TableCell>
                        <TableCell>{driver.managed_code || '-'}</TableCell>
                        <TableCell>{driver.email || '-'}</TableCell>
                        <TableCell>{driver.phone || driver.cellular || '-'}</TableCell>
                        <TableCell>
                          {driver.is_blocked ? (
                            <Badge variant="destructive">{t('employees.blocked')}</Badge>
                          ) : (
                            <Badge variant="default" className="bg-green-600">
                              {t('employees.active')}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : searchTerm ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('employees.noDriversMatching', { term: searchTerm })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">{t('employees.noDriversFound')}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Employees;
