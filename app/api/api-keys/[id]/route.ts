import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// For server-side API routes, use internal Docker network URL
const BACKEND_URL = process.env.BACKEND_URL 
  ? `${process.env.BACKEND_URL}/v1` 
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1')

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth-token')?.value
    
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const response = await fetch(`${BACKEND_URL}/api-keys/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-cache'
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend API error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to delete API key' }, 
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API key deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
