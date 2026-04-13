'use client'

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'

type ChartData = {
  name: string
  odometer: number
}

export default function HodometroChart({ data }: { data: ChartData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center text-slate-500 text-sm italic">
        Nenhum dado de hodômetro registrado.
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          
          {/* DEFINIÇÃO DO GRADIENTE */}
          <defs>
            <linearGradient id="colorOdometer" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={1} />
              <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
          
          <XAxis 
            dataKey="name" 
            stroke="#64748b" 
            fontSize={10} 
            fontWeight="600"
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
            tickMargin={12}
          />
          
          <YAxis 
            stroke="#64748b" 
            fontSize={10} 
            fontWeight="600"
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} 
            width={45}
            tickLine={false}
            axisLine={false}
          />
          
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
            contentStyle={{ 
              backgroundColor: 'rgba(7, 11, 63, 0.85)', 
              border: '1px solid rgba(56, 189, 248, 0.2)', 
              borderRadius: '16px',
              color: '#fff',
              fontWeight: '800',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(8px)'
            }}
            formatter={(value: any) => [`${Number(value || 0).toLocaleString('pt-BR')} km`, 'KM Registrada']}
            labelStyle={{ color: '#38bdf8', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
          />
          
          <Bar 
            dataKey="odometer" 
            fill="url(#colorOdometer)" 
            radius={[8, 8, 0, 0]} 
            barSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}