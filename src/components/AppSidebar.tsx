import { FileText, Wrench, Users, CheckSquare, AlertTriangle, Settings, Car } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { useVehicleRequestsQuery } from "@/hooks/queries/useVehicleRequestsQuery";
import { useVehiclesQuery } from "@/hooks/queries/useVehiclesQuery";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  { title: "Dashboard", url: "/", icon: FileText },
  { title: "Vehicle Fleet", url: "/vehicle-fleet", icon: Wrench },
  { title: "Employees", url: "/employees", icon: Users },
  { title: "Requests", url: "/requests", icon: CheckSquare },
  { title: "Event Reports", url: "/event-reports", icon: AlertTriangle },
  { title: "Form Templates", url: "/form-templates", icon: Settings },
];

export function AppSidebar() {
  const { data: requests = [] } = useVehicleRequestsQuery();
  const { data: vehicles = [] } = useVehiclesQuery();

  const pendingRequestsCount = requests.filter(
    (req) => req.status === "pending_manager"
  ).length;
  const activeVehiclesCount = vehicles.filter(
    (vehicle) => vehicle.motion_status === "moving"
  ).length;

  return (
    <Sidebar collapsible="none">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-3 px-2 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Car className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-foreground">FleetFlow</span>
            <span className="text-xs text-muted-foreground">Vehicle Management</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>NAVIGATION</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 hover:bg-primary/10 text-foreground"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>QUICK STATS</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-3 px-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Pending Requests</span>
                <Badge 
                  variant="outline" 
                  className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-900"
                >
                  {pendingRequestsCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Active Vehicles</span>
                <Badge 
                  variant="outline" 
                  className="bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-400 dark:border-teal-900"
                >
                  {activeVehiclesCount}
                </Badge>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
