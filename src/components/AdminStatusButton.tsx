import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Shield, LogOut, LogIn } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AdminStatusButton() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleClick = async () => {
    if (user && isAdmin) {
      navigate("/admin");
    } else if (user && !isAdmin) {
      await signOut();
      navigate("/auth");
    } else {
      navigate("/auth");
    }
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await signOut();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            {user && isAdmin ? (
              <>
                <Badge 
                  variant="default" 
                  className="cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1.5 px-3 py-1.5"
                  onClick={handleClick}
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span>Admin</span>
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleLogout}
                  className="h-8 w-8"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleClick}
                className="flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                <span>Logga in</span>
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {user && isAdmin ? (
            <div className="text-sm">
              <p className="font-semibold">Admin inloggad</p>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          ) : user ? (
            <p className="text-sm">Inte admin</p>
          ) : (
            <p className="text-sm">Klicka för att logga in</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
