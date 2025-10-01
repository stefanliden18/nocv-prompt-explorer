import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserInviteDialog } from '@/components/UserInviteDialog';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { UserPlus, Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, role, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get auth data for last sign in
      const usersWithAuth = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: authData } = await supabase.auth.admin.getUserById(profile.id);
          return {
            ...profile,
            last_sign_in_at: authData.user?.last_sign_in_at || null,
          };
        })
      );

      setUsers(usersWithAuth);
      setFilteredUsers(usersWithAuth);
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

  const getStatusBadge = (lastSignIn: string | null) => {
    if (!lastSignIn) {
      return <Badge variant="outline">Ej aktiverad</Badge>;
    }
    return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">Aktiv</Badge>;
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
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
                          <TableCell>{getStatusBadge(user.last_sign_in_at)}</TableCell>
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
    </AdminLayout>
  );
}