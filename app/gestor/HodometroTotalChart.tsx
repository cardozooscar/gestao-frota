'use client'

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts'

// O TypeScript agora sabe que a página manda a "placa", e não o "name"
type ChartData = {
  placa: string
  odometer: number
  [key: string]: any // Truque para o TS aceitar qualquer dado extra sem reclamar
}

const CORES_PALETA = [
  '#3b82f6', '#22d3ee', '#34d399', '#a78bfa', 
  '#fb923c', '#f87171', '#fbbf24', '#e2e8f0',
]

export default function HodometroTotalChart({ data }: { data: ChartData[] }) {
  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          
          <XAxis 
            dataKey="placa" 
            tick={false} 
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} 
          />
          
          <YAxis 
            stroke="#94a3b8" 
            fontSize={11} 
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} 
            width={60}
          />
          
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            contentStyle={{ 
              backgroundColor: '#070b3f', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '12px',
              color: '#fff',
              fontWeight: 'bold',
              padding: '12px'
            }}
            formatter={(value: any) => [`${Number(value || 0).toLocaleString('pt-BR')} km`, 'Hodômetro']}
            labelStyle={{ color: '#fff', marginBottom: '4px' }}
          />

          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="square"
            iconSize={12}
            formatter={(value) => <span style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 'bold', marginLeft: '6px' }}>{value}</span>}
          />
          
          <Bar dataKey="odometer" radius={[6, 6, 0, 0]} barSize={40}>
            {data?.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CORES_PALETA[index % CORES_PALETA.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}