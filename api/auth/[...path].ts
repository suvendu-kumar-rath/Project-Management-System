import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';
import { createClient } from '@supabase/supabase-js';
import type { Request, Response, NextFunction } from 'express';

const app = express();
app.use(cors());
app.use(express.json());

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid Token' });

  const { data: userData, error: dbError } = await supabaseAdmin
    .from('users').select('role').eq('id', user.id).single();

  if (dbError || !userData || userData.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden. Requires ADMIN role.' });
  }
  next();
};

app.post('/api/auth/create-user', requireAdmin, async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name || !role)
      return res.status(400).json({ error: 'Missing required fields' });
    if (!['DESIGNER', 'OPERATIONS'].includes(role))
      return res.status(400).json({ error: 'Invalid role' });

    const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { name, role }
    });
    if (authError) throw authError;

    const { error: dbError } = await supabaseAdmin.from('users').insert({
      id: data.user.id, name, email, role, is_active: true
    });
    if (dbError && dbError.code !== '23505') console.error('Failed to insert user:', dbError);

    res.status(201).json({ message: 'User created successfully', user: data.user });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.delete('/api/auth/delete-user/:id', requireAdmin, async (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) return res.status(400).json({ error: 'Missing user ID' });

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error: any) {
    if (error.code === '23503')
      return res.status(400).json({ error: 'Cannot delete user: They are assigned to one or more projects.' });
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default serverless(app);
