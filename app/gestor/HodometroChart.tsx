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
  placa: string
  odometer: number
}

export default function HodometroTotalChart({ data }: { data: ChartData[] }) {
  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
          
          <XAxis 
            dataKey="placa" 
            stroke="#94a3b8" 
            fontSize={11}
            fontWeight="bold"
            interval={0}
            angle={-45}
            textAnchor="end"
            tickMargin={10}
            height={60}
          />
          
          <YAxis 
            stroke="#94a3b8" 
            fontSize={11} 
            tickFormatter={(value) => `${value.toLocaleString('pt-BR')} km`}
            width={80}
          />
          
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{ 
              backgroundColor: '#070b3f', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '12px',
              color: '#fff',
              fontWeight: 'bold'
            }}
            formatter={(value: any) => [`${Number(value || 0).toLocaleString('pt-BR')} km`, 'Hodômetro']}
          />
          
          <Bar 
            dataKey="odometer" 
            fill="#3b82f6" 
            radius={[6, 6, 0, 0]} 
            barSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}