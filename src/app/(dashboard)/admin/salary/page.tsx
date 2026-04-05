import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SalaryClient from './SalaryClient'

export const revalidate = 60

export default async function SalaryPage() {
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

  // Fetch all active employees
  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // Fetch current month's salary_payments
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' })
  const currentYear = new Date().getFullYear()

  const { data: payments } = await supabase
    .from('salary_payments')
    .select('*')
    .eq('month', currentMonth)
    .eq('year', currentYear)

  return <SalaryClient employees={employees || []} payments={payments || []} adminProfile={profile} currentMonth={currentMonth} currentYear={currentYear} />
}
