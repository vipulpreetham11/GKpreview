import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StaffClient from './StaffClient'

export default async function StaffPage() {
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

  // Fetch all profiles where role = 'worker'
  const { data: workers } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'worker')
    .order('created_at', { ascending: false })

  return <StaffClient initialWorkers={workers || []} />
}
