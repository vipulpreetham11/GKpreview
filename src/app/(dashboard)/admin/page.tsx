import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminClient from './AdminClient'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify profile role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/worker')
  }

  // Fetch all expenses
  const { data: expenses, error: expError } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false })

  if (expError) {
    console.error('Failed to load expenses:', expError.message)
  }

  // Fetch all appointments
  const { data: appointments, error: apptError } = await supabase
    .from('appointments')
    .select('*')
    .order('created_at', { ascending: false })

  if (apptError) {
    console.error('Failed to load appointments:', apptError.message)
  }

  // Fetch all budgets for current month
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' })
  const currentYear = new Date().getFullYear()

  const { data: budgets, error: budgetError } = await supabase
    .from('budgets')
    .select('*')
    .eq('month', currentMonth)
    .eq('year', currentYear)

  if (budgetError) {
    console.error('Failed to load budgets:', budgetError.message)
  }

  return (
    <AdminClient
      profile={profile}
      initialExpenses={expenses || []}
      initialAppointments={appointments || []}
      initialBudgets={budgets || []}
    />
  )
}
