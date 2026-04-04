import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // 2. Create a Supabase server client using @/lib/supabase/server
    const supabase = await createClient()

    // 3. Check the user is logged in and their role is admin (query profiles table)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    // 4. If not admin return 403
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch to log first
    const { data: expense } = await supabase.from('expenses').select('*').eq('id', id).single()

    // 5. Delete the expense from the expenses table where id matches
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    // 7. Return { error: message } on failure
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (expense) {
      await supabase.from('audit_logs').insert({
        action: 'expense_deleted',
        performed_by: user.id,
        performed_by_name: profile.full_name,
        target_type: 'expense',
        target_id: id,
        details: { amount: expense.amount, category: expense.category, department: expense.department }
      })
    }

    // 6. Return { success: true } on success
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
