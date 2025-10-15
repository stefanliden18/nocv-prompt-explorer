import { useAuth } from "@/contexts/AuthContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AdminHeader() {
  const { user, isAdmin, role } = useAuth();

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const getRoleBadge = () => {
    if (role === 'admin') return <Badge variant="default">Admin</Badge>;
    if (role === 'recruiter') return <Badge variant="secondary">Rekryterare</Badge>;
    return <Badge variant="outline">Användare</Badge>;
  };

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <h1 className="text-xl font-semibold">Admin Panel</h1>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium">{user?.email}</p>
          <div className="flex justify-end">
            {getRoleBadge()}
          </div>
        </div>
        <Avatar>
          <AvatarFallback>
            {user?.email ? getInitials(user.email) : "??"}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}