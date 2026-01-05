import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const routeLabels: Record<string, string> = {
  "": "Dashboard",
  "trips": "Trips",
  "vehicle-fleet": "Vehicle Fleet",
  "vehicle": "Vehicle Profile",
  "vehicle-assign-groups": "Vehicle Assign Groups",
  "calendar": "Calendar",
  "employees": "Employees",
  "requests": "Requests",
  "new-request": "New Request",
  "new": "New Request",
  "edit": "Edit Request",
  "event-reports": "Event Reports",
  "form-templates": "Form Templates",
  "roles": "Roles",
};

// Map child routes to their parent for breadcrumb linking
const parentRoutes: Record<string, { path: string; label: string }> = {
  "vehicle": { path: "/vehicle-fleet", label: "Vehicle Fleet" },
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  // Don't show breadcrumbs on dashboard
  if (pathSegments.length === 0) {
    return null;
  }

  // Build breadcrumbs with parent route injection for special cases
  const breadcrumbs: { path: string; label: string; isLast: boolean }[] = [];
  
  pathSegments.forEach((segment, index) => {
    const path = "/" + pathSegments.slice(0, index + 1).join("/");
    const label = routeLabels[segment] || segment.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    const isLast = index === pathSegments.length - 1;
    
    // If this is the first segment and has a parent route, inject parent first
    if (index === 0 && parentRoutes[segment]) {
      breadcrumbs.push({
        path: parentRoutes[segment].path,
        label: parentRoutes[segment].label,
        isLast: false,
      });
      // Skip adding "Vehicle Profile" since it doesn't have its own page
      // Just add the license plate as the final breadcrumb
      return;
    }
    
    breadcrumbs.push({ path, label, isLast });
  });

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/" className="flex items-center gap-1 hover:text-primary">
              <Home className="h-4 w-4" />
              <span className="sr-only">Home</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbs.map((crumb, index) => (
          <span key={crumb.path} className="contents">
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage className="font-medium">{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={crumb.path} className="hover:text-primary">
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
