'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

type Profile = {
  nome: string
  role: 'admin' | 'supervisor' | 'tecnico'
}

type MenuItem = {
  label: string
  href: string
  icon: string
  roles: Array<'admin' | 'supervisor'>
}

// Item "Revisões" e o novo "Recibos EPI" adicionados!
const menuItems: MenuItem[] = [
  { label: 'Painel', href: '/gestor', icon: '⌂', roles: ['admin', 'supervisor'] },
  { label: 'Veículos', href: '/gestor/veiculos', icon: '▣', roles: ['admin', 'supervisor'] },
  { label: 'Revisões', href: '/gestor/revisoes', icon: '🔧', roles: ['admin', 'supervisor'] },
  { label: 'Técnicos', href: '/gestor/tecnicos', icon: '◉', roles: ['admin'] },
  { label: 'Recibos EPI', href: '/gestor/recibos-epi', icon: '📦', roles: ['admin', 'supervisor'] },
  { label: 'Vínculos', href: '/gestor/vinculos', icon: '⇄', roles: ['admin'] },
  { label: 'Aprovações', href: '/gestor/aprovacoes', icon: '✓', roles: ['admin'] },
  { label: 'Usuários', href: '/gestor/usuarios', icon: '☰', roles: ['admin'] },
]

export default function GestorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('gestor-sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  useEffect(() => {
    localStorage.setItem('gestor-sidebar-collapsed', String(collapsed))
  }, [collapsed])

  useEffect(() => {
    async function loadProfile() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('nome, role')
        .eq('id', userData.user.id)
        .single()

      if (error || !data || !['admin', 'supervisor'].includes(data.role)) {
        router.push('/login')
        return
      }

      setProfile(data as Profile)
      setLoading(false)
    }

    loadProfile()
  }, [router])

  const visibleMenu = useMemo(() => {
    if (!profile) return []
    return menuItems.filter((item) =>
      item.roles.includes(profile.role as 'admin' | 'supervisor')
    )
  }, [profile])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function isActive(href: string) {
    if (href === '/gestor') return pathname === '/gestor'
    return pathname.startsWith(href)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#eef2f5] text-[#22313f] flex items-center justify-center">
        <p className="text-sm">Carregando ambiente de gestão...</p>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-[#eef2f5] text-[#22313f]">
      <div className="lg:hidden border-b border-slate-200 bg-white px-4 py-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
            Fibranet Brasil
          </p>
          <h1 className="text-lg font-bold text-slate-800">Gestão de Frota</h1>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
        >
          Menu
        </button>
      </div>

      <div className="flex">
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 border-r border-[#1f2a34] bg-[#1f2a34] text-white transition-all duration-300
            ${collapsed ? 'w-24' : 'w-72'}
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
          `}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-white/10 px-4 py-5">
              <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/10">
                  <img
                    src="https://raw.githubusercontent.com/cardozooscar/imagenscgr/refs/heads/main/WhatsApp_Image_2025-10-30_at_10.21.26__1_-removebg-preview.png"
                    alt="Fibranet"
                    className="max-h-8 max-w-8 object-contain"
                  />
                </div>

                {!collapsed && (
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                      Fibranet Brasil
                    </p>
                    <h2 className="truncate text-xl font-bold">Gestão de Frota</h2>
                  </div>
                )}
              </div>

              <div className={`mt-4 flex ${collapsed ? 'justify-center' : 'justify-end'}`}>
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                  title={collapsed ? 'Expandir menu' : 'Recolher menu'}
                >
                  {collapsed ? '»' : '«'}
                </button>
              </div>
            </div>

            {!collapsed && (
              <div className="border-b border-white/10 px-4 py-4">
                <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Usuário conectado
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {profile?.nome}
                  </p>
                  <div className="mt-3 inline-flex rounded-full bg-[#39b6d6]/15 px-3 py-1 text-xs font-bold text-[#8fe6ff] ring-1 ring-[#39b6d6]/25">
                    {profile?.role === 'admin' ? 'Administrador' : 'Supervisor'}
                  </div>
                </div>
              </div>
            )}

            <nav className="flex-1 px-3 py-4">
              {!collapsed && (
                <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Navegação
                </p>
              )}

              <div className="space-y-1.5">
                {visibleMenu.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`group flex items-center rounded-lg px-3 py-3 text-sm font-semibold transition ${
                      collapsed ? 'justify-center' : 'gap-3'
                    } ${
                      isActive(item.href)
                        ? 'bg-[#2f6eea] text-white shadow-md'
                        : 'text-slate-300 hover:bg-white/8 hover:text-white'
                    }`}
                    title={collapsed ? item.label : ''}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[15px]">
                      {item.icon}
                    </span>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                ))}
              </div>
            </nav>

            <div className="mt-auto border-t border-white/10 p-3">
              <button
                onClick={handleLogout}
                className={`w-full rounded-lg bg-[#d9534f] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#c83e39] ${
                  collapsed ? 'px-0' : ''
                }`}
                title={collapsed ? 'Sair' : ''}
              >
                {collapsed ? '⎋' : 'Sair'}
              </button>
            </div>
          </div>
        </aside>

        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <div
          className={`flex-1 transition-all duration-300 ${
            collapsed ? 'lg:ml-24' : 'lg:ml-72'
          }`}
        >
          <div className="min-h-screen">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}