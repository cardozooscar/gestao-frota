'use client'

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, // 🔥 Importamos a Legenda
  ResponsiveContainer,
  Cell // 🔥 Importamos Cell para colorir barras individuais
} from 'recharts'

type ChartData = {
  placa: string
  odometer: number
}

// 🔥 Paleta de cores moderna e profissional (uma cor para cada uma das 8 barras do ranking)
const CORES_PALETA = [
  '#3b82f6', // Azul (PZG8449)
  '#22d3ee', // Ciano (QTU5G95)
  '#34d399', // Verde (RDK6J27)
  '#a78bfa', // Roxo (PLL4G81)
  '#fb923c', // Laranja (SKK8168)
  '#f87171', // Vermelho (SKK6F34)
  '#fbbf24', // Amarelo (SKK5C08)
  '#e2e8f0', // Cinza Claro (SKK9F71)
]

export default function HodometroTotalChart({ data }: { data: ChartData[] }) {
  
  return (
    <div style={{ width: '100%', height: 350 }}> {/* Altura um pouco maior para a legenda */}
      <ResponsiveContainer>
        <BarChart 
          data={data} 
          margin={{ top: 10, right: 10, left: 10, bottom: 10 }} 
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          
          {/* Eixo X agora está LIMPO, sem texto das placas */}
          <XAxis 
            dataKey="placa" 
            tick={false} // 🔥 Removemos o texto das placas daqui
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} // Linha sutil
          />
          
          <YAxis 
            stroke="#94a3b8" 
            fontSize={11} 
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} // Simplifica pra '136k'
            width={60}
          />
          
          {/* Tooltip profissional mantido */}
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
            labelStyle={{ color: '#fff', marginBottom: '4px' }} // Placa em branco no Tooltip
          />

          {/* 🔥 ADICIONAMOS A LEGENDA PROFISSIONAL ABAIXO */}
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }} // Espaço entre gráfico e legenda
            iconType="square" // Quadrado colorido na legenda
            iconSize={12} // Tamanho do ícone
            formatter={(value, entry, index) => {
              // value aqui é a 'placa' vinda do dataKey
              return <span style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 'bold', marginLeft: '6px' }}>{value}</span>;
            }}
          />
          
          {/* Configuração da Barra */}
          <Bar 
            dataKey="odometer" 
            radius={[6, 6, 0, 0]} 
            barSize={40}
          >
            {/* 🔥 Mágica: Colorimos cada barra usando a paleta */}
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={CORES_PALETA[index % CORES_PALETA.length]} // Pega cor da paleta
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}