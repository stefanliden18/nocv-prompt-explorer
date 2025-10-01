import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  Building2, 
  Users, 
  LogOut 
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
  { title: "Ansökningar", url: "/admin/applications", icon: FileText },
  { title: "Företag", url: "/admin/companies", icon: Building2 },
  { title: "Användare", url: "/admin/users", icon: Users },
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