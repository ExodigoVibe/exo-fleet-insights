import { FileText, Wrench, Users, CheckSquare, AlertTriangle, Settings, Car, Shield, LogOut, Route } from "lucide-react";
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
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { title: "Dashboard", url: "/", icon: FileText, roles: ["admin", "coordinator", "employee"] },
  { title: "Trips", url: "/trips", icon: Route, roles: ["admin", "coordinator", "employee"] },
  { title: "Vehicle Fleet", url: "/vehicle-fleet", icon: Wrench, roles: ["admin", "coordinator"] },
  { title: "Employees", url: "/employees", icon: Users, roles: ["admin", "coordinator"] },
  { title: "Requests", url: "/requests", icon: CheckSquare, roles: ["admin", "coordinator", "employee"] },
  { title: "Event Reports", url: "/event-reports", icon: AlertTriangle, roles: ["admin", "coordinator", "employee"] },
  { title: "Form Templates", url: "/form-templates", icon: Settings, roles: ["admin", "coordinator"] },
  { title: "Roles", url: "/roles", icon: Shield, roles: ["admin", "coordinator"] },
];

export function AppSidebar() {
  const { data: requests = [] } = useVehicleRequestsQuery();
  const { data: eventReports = [] } = useEventReportsQuery();
  const navigate = useNavigate();

  // Get current user from localStorage
  const azureUserStr = localStorage.getItem("azureUser");
  const userRole = localStorage.getItem("userRole") || "employee";
  const azureUser = azureUserStr ? JSON.parse(azureUserStr) : null;

  const currentUser = azureUser ? {
    name: azureUser.name || azureUser.email,
    email: azureUser.email,
    initials: azureUser.name?.charAt(0).toUpperCase() || azureUser.email?.charAt(0).toUpperCase() || "U",
    role: userRole,
  } : {
    name: "Guest User",
    email: "guest@example.com",
    initials: "G",
    role: "employee",
  };

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(currentUser.role)
  );

  const pendingRequestsCount = requests.filter(
    (req) => req.status === "pending_manager"
  ).length;
  const pendingEventReportsCount = eventReports.filter(
    (report) =>  report.status === "pending"
  ).length;

  const handleLogout = async () => {
    try {
      localStorage.removeItem("azureUser");
      localStorage.removeItem("azureAccessToken");
      localStorage.removeItem("userRole");
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

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
                <span className="text-sm font-medium text-foreground truncate w-full">
                  {currentUser.name}
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer hover:bg-gray-100 hover:text-foreground">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
