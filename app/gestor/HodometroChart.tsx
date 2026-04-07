'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

type ChartItem = {
  vehicle_id: string
  placa: string
  modelo: string | null
  km_rodado: number
}

type Props = {
  data: ChartItem[]
}

function formatKm(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export default function HodometroChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Ainda não há dados suficientes para montar o gráfico. É preciso ter pelo menos
        duas inspeções com hodômetro no mês para cada veículo.
      </div>
    )
  }

  return (
    <div className="h-[380px] w-full rounded-md border border-slate-200 bg-white p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="placa"
            tick={{ fontSize: 12 }}
            angle={-20}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: any) => [`${formatKm(Number(value))} km`, 'Rodado no mês']}
            labelFormatter={(label) => `Veículo: ${label}`}
          />
          <Bar dataKey="km_rodado" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${entry.vehicle_id}`}
                fill={
                  index === 0
                    ? '#2f6eea'
                    : index === 1
                      ? '#35c6cf'
                      : index === 2
                        ? '#38a96a'
                        : '#94a3b8'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}