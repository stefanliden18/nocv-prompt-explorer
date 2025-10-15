import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserInviteDialog } from '@/components/UserInviteDialog';
import { UserRoleDialog } from '@/components/UserRoleDialog';
import { UserStatusToggle } from '@/components/UserStatusToggle';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { UserPlus, Search, Loader2, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface UserData {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  banned_until: string | null;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [activeAdminCount, setActiveAdminCount] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Call Edge Function to fetch users with auth data
      const { data, error } = await supabase.functions.invoke('get-users');

      if (error) throw error;

      setUsers(data.users || []);
      setFilteredUsers(data.users || []);

      // Count active admins
      const { data: count } = await supabase.rpc('count_active_admins');
      setActiveAdminCount(count || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((user) =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, users]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default">Administratör</Badge>;
      case 'recruiter':
        return <Badge variant="secondary">Rekryterare</Badge>;
      case 'user':
        return <Badge variant="outline">Användare</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (user: UserData) => {
    // Check if user is banned
    if (user.banned_until) {
      const bannedUntil = new Date(user.banned_until);
      if (bannedUntil > new Date()) {
        return <Badge variant="destructive">Avstängd</Badge>;
      }
    }
    
    if (!user.last_sign_in_at) {
      return <Badge variant="outline">Ej aktiverad</Badge>;
    }
    return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">Aktiv</Badge>;
  };

  const isUserActive = (user: UserData): boolean => {
    if (user.banned_until) {
      const bannedUntil = new Date(user.banned_until);
      if (bannedUntil > new Date()) {
        return false;
      }
    }
    return true;
  };

  const isLastAdmin = (user: UserData): boolean => {
    return user.role === 'admin' && activeAdminCount <= 1 && isUserActive(user);
  };

  const handleRoleChange = (user: UserData) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Användare</h1>
            <p className="text-muted-foreground">Hantera användare och roller</p>
          </div>
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Ny användare
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Alla användare</CardTitle>
            <CardDescription>
              Sök och filtrera användare i systemet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Sök på e-post..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla roller</SelectItem>
                  <SelectItem value="admin">Administratör</SelectItem>
                  <SelectItem value="recruiter">Rekryterare</SelectItem>
                  <SelectItem value="user">Användare</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>E-post</TableHead>
                      <TableHead>Roll</TableHead>
                      <TableHead>Skapad</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aktiv</TableHead>
                      <TableHead className="text-right">Åtgärder</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Inga användare hittades
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>
                            {format(new Date(user.created_at), 'PPP', { locale: sv })}
                          </TableCell>
                          <TableCell>{getStatusBadge(user)}</TableCell>
                          <TableCell>
                            <UserStatusToggle
                              userId={user.id}
                              userEmail={user.email}
                              currentStatus={isUserActive(user)}
                              isLastAdmin={isLastAdmin(user)}
                              onSuccess={fetchUsers}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleRoleChange(user)}>
                                  Byt roll
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <UserInviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={fetchUsers}
      />

      {selectedUser && (
        <UserRoleDialog
          open={roleDialogOpen}
          onOpenChange={setRoleDialogOpen}
          userId={selectedUser.id}
          currentRole={selectedUser.role}
          userEmail={selectedUser.email}
          isLastAdmin={isLastAdmin(selectedUser)}
          onSuccess={fetchUsers}
        />
      )}
    </AdminLayout>
  );
}
