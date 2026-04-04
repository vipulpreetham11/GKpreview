import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AuditClient from './AuditClient'

export const dynamic = 'force-dynamic'

export default async function AuditPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/worker')
  }

  const { data: auditLogs, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching audit logs:', error)
  }

  return <AuditClient initialLogs={auditLogs || []} />
}
