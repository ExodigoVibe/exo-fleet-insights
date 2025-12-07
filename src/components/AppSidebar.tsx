import { FileText, Wrench, Users, CheckSquare, AlertTriangle, Settings, Car, Shield, LogOut, Route, ClipboardList, Calendar } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
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
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useVehicleRequestsQuery } from "@/hooks/queries/useVehicleRequestsQuery";
import { Badge } from "@/components/ui/badge";
import { useEventReportsQuery } from "@/hooks/queries/useEventReportsQuery";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const menuItems = [
  { title: "Dashboard", url: "/", icon: FileText, roles: ["admin", "coordinator", "employee"] },
  { title: "Trips", url: "/trips", icon: Route, roles: ["admin", "coordinator", "employee"] },
  { title: "Vehicle Fleet", url: "/vehicle-fleet", icon: Wrench, roles: ["admin", "coordinator"] },
  { title: "Vehicle Assign Groups", url: "/vehicle-assign-groups", icon: ClipboardList, roles: ["admin"] },
  { title: "Calendar", url: "/calendar", icon: Calendar, roles: ["admin"] },
  { title: "Employees", url: "/employees", icon: Users, roles: ["admin", "coordinator"] },
  { title: "Requests", url: "/requests", icon: CheckSquare, roles: ["admin", "coordinator", "employee"] },
  { title: "Event Reports", url: "/event-reports", icon: AlertTriangle, roles: ["admin", "coordinator", "employee"] },
  { title: "Form Templates", url: "/form-templates", icon: Settings, roles: ["admin", "coordinator"] },
  { title: "Roles", url: "/roles", icon: Shield, roles: ["admin", "coordinator"] },
];

export function AppSidebar() {
  const { data: requests = [] } = useVehicleRequestsQuery();
  const { data: eventReports = [] } = useEventReportsQuery();
  const { user, logout, isAdmin, isCoordinator, hasAdminAccess } = useAuth();

  // Get user initials from name or email
  const getUserInitials = () => {
    if (user?.name) {
      const nameParts = user.name.split(' ');
      if (nameParts.length >= 2) {
        return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
      }
      return nameParts[0].charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  const currentUser = {
    name: user?.name || user?.email || "",
    email: user?.email || "",
    initials: getUserInitials(),
    role: user?.role || "employee",
  };

  // Determine if user has admin/coordinator access
  const hasFullAccess = isAdmin || isCoordinator;

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(currentUser.role)
  );

  // Filter counts by user email for non-admin users
  const userRequests = hasAdminAccess ? requests : requests.filter((r) => r.email === user?.email);
  const userEventReports = hasAdminAccess ? eventReports : eventReports.filter((r) => r.employee_name === user?.email);

  const pendingRequestsCount = userRequests.filter(
    (req) => req.status === "pending_manager"
  ).length;
  const pendingEventReportsCount = userEventReports.filter(
    (report) =>  report.status === "pending"
  ).length;

  return (
    <Sidebar collapsible="icon">
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
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 hover:bg-primary/10 text-foreground"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {<span>{item.title}</span>}
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
                    className="bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-900"
                  >
                    {pendingRequestsCount}
                  </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Pending Event Reports</span>
                  <Badge 
                    variant="outline" 
                    className="bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900"
                  >
                    {pendingEventReportsCount}
                  </Badge>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 px-2 py-3 hover:bg-gray-100 hover:text-foreground rounded-lg transition-colors w-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {currentUser.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-foreground truncate max-w-[140px]">
                  {currentUser.name}
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-sm">
              <div className="font-medium">{currentUser.name}</div>
              <div className="text-xs text-muted-foreground mt-1 capitalize">Role: {currentUser.role}</div>
            </div>
            <DropdownMenuItem onClick={logout} className="cursor-pointer hover:bg-gray-100 hover:text-foreground">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
