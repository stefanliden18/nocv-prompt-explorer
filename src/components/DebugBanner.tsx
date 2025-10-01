import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, User, Mail, Shield } from "lucide-react";

export function DebugBanner() {
  const { user, isAdmin, role, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-yellow-500 text-yellow-950 px-4 py-2 text-sm font-mono border-b-2 border-yellow-600">
        ⏳ Laddar auth...
      </div>
    );
  }

  return (
    <div className="bg-purple-600 text-white px-4 py-2 text-sm font-mono border-b-2 border-purple-800 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {user ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span className="font-bold">
            {user ? "✓ INLOGGAD" : "✗ UTLOGGAD"}
          </span>
        </div>

        {user && (
          <>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>ID: {user.id.slice(0, 8)}...</span>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>{user.email}</span>
            </div>

            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className={role === 'admin' ? "font-bold text-yellow-300" : ""}>
                {role === 'admin' ? '🔑 ADMIN' : role === 'recruiter' ? '👔 RECRUITER' : '👤 USER'}
              </span>
            </div>
          </>
        )}
      </div>

      {user && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate("/admin")}
          className="bg-white text-purple-600 hover:bg-purple-50"
        >
          Gå till Admin
        </Button>
      )}
    </div>
  );
}
