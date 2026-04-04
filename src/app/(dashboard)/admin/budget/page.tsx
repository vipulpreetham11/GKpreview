import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BudgetClient from './BudgetClient'

export default async function BudgetPage() {
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

  // Fetch all budgets
  const { data: budgets } = await supabase
    .from('budgets')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  return <BudgetClient budgets={budgets || []} adminProfile={profile} />
}
