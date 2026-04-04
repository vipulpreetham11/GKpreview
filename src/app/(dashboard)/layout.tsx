import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        role={profile.role}
        fullName={profile.full_name}
        department={profile.department}
      />
      <div className="lg:pl-56 pt-14 lg:pt-0 min-h-screen">
        {children}
      </div>
    </div>
  )
}