import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const BACKEND_URL = process.env.BACKEND_URL
  ? `${process.env.BACKEND_URL}/v1`
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1')

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth-token')?.value

    if (!authToken) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    const res = await fetch(`${BACKEND_URL}/api/images/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: (data as { detail?: string })?.detail ?? 'Failed to delete image' },
        { status: res.status }
      )
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[media/images/[id] DELETE]', e)
    return NextResponse.json(
      { success: false, message: (e as Error)?.message ?? 'Server error' },
      { status: 500 }
    )
  }
}
