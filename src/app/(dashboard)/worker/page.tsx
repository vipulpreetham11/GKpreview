import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import WorkerClient from './WorkerClient'

export default async function WorkerPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') redirect('/admin')

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('added_by', user.id)
    .order('date', { ascending: false })

  return (
    <WorkerClient
      profile={profile}
      initialExpenses={expenses || []}
    />
  )
}
