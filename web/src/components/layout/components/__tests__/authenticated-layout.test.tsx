/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useEffect } from 'react'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { useAuthStore, type AuthBundle } from '@/stores/auth-store'
import { AuthenticatedLayout } from '../authenticated-layout'

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }))

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }))
vi.mock('@/components/page-transition', () => ({
  AnimatedOutlet: () => null,
}))
vi.mock('@/components/skip-to-main', () => ({
  SkipToMain: () => null,
}))
vi.mock('@/components/ui/sidebar', () => ({
  SidebarInset: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SidebarProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))
vi.mock('@/context/layout-provider', () => ({
  LayoutProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))
vi.mock('@/context/search-provider', () => ({
  SearchProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))
vi.mock('../app-header', () => ({ AppHeader: () => null }))
vi.mock('../app-sidebar', () => ({ AppSidebar: () => null }))

const bundle: AuthBundle = {
  access_token: 'active-token',
  token_type: 'Bearer',
  access_expires_at: Math.floor(Date.now() / 1000) + 600,
  user: { id: 42, username: 'test-user', role: 1 },
  session: {
    sid: 'session-a',
    current: true,
    login_method: 'password',
    ip: '127.0.0.1',
    user_agent: 'test',
    created_at: 100,
    last_active_at: 100,
    expires_at: 1000,
  },
}

beforeEach(() => {
  navigate.mockClear()
  useAuthStore.getState().auth.reset('complete')
})

afterEach(() => {
  cleanup()
  useAuthStore.getState().auth.reset('idle')
})

describe('authenticated layout', () => {
  test('auth loss unmounts protected children and redirects to sign-in', async () => {
    useAuthStore.getState().auth.setBundle(bundle)
    const unmounted = vi.fn()
    function ProtectedChild() {
      useEffect(() => () => unmounted(), [])
      return <div>Protected content</div>
    }

    render(
      <AuthenticatedLayout>
        <ProtectedChild />
      </AuthenticatedLayout>
    )
    expect(screen.getByText('Protected content')).toBeTruthy()

    await act(async () => {
      useAuthStore.getState().auth.reset('complete')
    })

    expect(screen.queryByText('Protected content')).toBeNull()
    expect(unmounted).toHaveBeenCalledOnce()
    expect(navigate).toHaveBeenCalledWith({ to: '/sign-in', replace: true })
  })
})
