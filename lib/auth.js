import { supabase } from './supabase'

// Resolve usuário admin a partir do token Bearer. Retorna o objeto user (com role)
// quando o token é válido E user.role === 'admin' E user.ativo === true.
// Caso contrário retorna null — caller responde 401/403.
export async function getAdminUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  const { data: u } = await supabase
    .from('usuarios')
    .select('role, ativo')
    .eq('id', user.id)
    .single()
  if (!u?.ativo || u.role !== 'admin') return null
  return { ...user, role: u.role }
}
