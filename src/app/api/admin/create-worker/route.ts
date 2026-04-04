import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // 1. Verify the caller is an authenticated admin
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
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
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: callerProfile } = await supabaseAuth
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (!callerProfile || callerProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // 2. Parse request body
    const body = await request.json()
    const { fullName, username, password, department } = body

    if (!fullName || !username || !password || !department) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // 3. Create a Supabase admin client using the SERVICE ROLE key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 4. Create auth user with email = username@gkhospitals.internal and the given password
    const email = `${username.toLowerCase().trim()}@gkhospitals.internal`
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm so they can login immediately
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // 5. Update the profile row to set full_name, username, department, role = 'worker'
    // First, wait a brief moment for the Supabase trigger to create the initial profile row (if you have one)
    // Or just upsert safely.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUser.user.id,
        full_name: fullName,
        username: username.toLowerCase().trim(),
        department,
        role: 'worker',
      })

    if (profileError) {
      return NextResponse.json(
        { error: `User created but profile update failed: ${profileError.message}` },
        { status: 500 }
      )
    }

    const { data: newProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', newUser.user.id)
      .single()

    await supabaseAdmin.from('audit_logs').insert({
      action: 'worker_created',
      performed_by: user.id,
      performed_by_name: callerProfile.full_name || 'Admin',
      target_type: 'profile',
      target_id: newUser.user.id,
      details: { username: newProfile?.username, department: newProfile?.department, role: 'worker' }
    })

    // 6. Returns { success: true } or { error: message }
    return NextResponse.json({ success: true, profile: newProfile })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
