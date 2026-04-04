import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: callerProfile } = await supabaseAuth
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!callerProfile || callerProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { employeeId, month, year } = await request.json()

    if (!employeeId || !month || !year) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Get employee details
    const { data: employee, error: empError } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single()

    if (empError || !employee) throw new Error('Employee not found')

    // 2. Create salary_payment
    const { data: payment, error: payError } = await supabaseAdmin
      .from('salary_payments')
      .insert({
        employee_id: employee.id,
        amount: employee.salary,
        month,
        year,
        paid_by: user.id
      })
      .select()
      .single()

    if (payError) throw payError

    // 3. Log into expenses automatically
    const { error: expError } = await supabaseAdmin
      .from('expenses')
      .insert({
        amount: employee.salary,
        category: 'Staff Wages',
        description: `Salary - ${employee.full_name} - ${month} ${year}`,
        date: new Date().toISOString().split('T')[0],
        department: employee.department,
        added_by: user.id,
        added_by_name: callerProfile.full_name
      })

    if (expError) throw expError

    await supabaseAdmin.from('audit_logs').insert({
      action: 'salary_paid',
      performed_by: user.id,
      performed_by_name: callerProfile.full_name || 'Admin',
      target_type: 'salary_payment',
      target_id: payment.id,
      details: { amount: employee.salary, employee: employee.full_name, month_year: `${month} ${year}` }
    })

    return NextResponse.json({ success: true, payment })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
