import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  Building2, 
  Users, 
  Upload,
  Activity,
  FileEdit,
  LogOut,
  Kanban,
  Shield,
  Film
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Jobb", url: "/admin/jobs", icon: Briefcase },
  { title: "Demo-jobb", url: "/admin/demo-jobs", icon: Film },
  { title: "Importera jobb", url: "/admin/jobs/import", icon: Upload },
  { title: "Ansökningar", url: "/admin/applications", icon: FileText },
  { title: "Rekryteringstavla", url: "/admin/recruitment-board", icon: Kanban },
  { title: "Företag", url: "/admin/companies", icon: Building2 },
  { title: "Användare", url: "/admin/users", icon: Users },
  { title: "Händelselogg", url: "/admin/activity", icon: Activity },
  { title: "Redigera Om oss", url: "/admin/about/edit", icon: FileEdit },
  { title: "Redigera Kontakt", url: "/admin/contact/edit", icon: FileEdit },
  { title: "Redigera Företag", url: "/admin/companies/edit", icon: FileEdit },
  { title: "GDPR-policy", url: "/admin/gdpr-policy", icon: Shield },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { signOut } = useAuth();
  const currentPath = location.pathname;

  const isCollapsed = state === "collapsed";

  const getNavCls = (isActive: boolean) =>
    isActive 
      ? "bg-primary/10 text-primary font-medium" 
      : "hover:bg-muted/50";

  return (
    <Sidebar
      className={isCollapsed ? "w-14" : "w-64"}
      collapsible="icon"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = currentPath === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end 
                        className={getNavCls(isActive)}
                      >
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                  {!isCollapsed && <span>Logga ut</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}