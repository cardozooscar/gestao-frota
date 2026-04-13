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
  // Ajuste fino: Se você tiver muitas placas, aumente o valor de 'left' na margin abaixo
  // para dar espaço para o texto da placa sem cortá-lo.
  
  return (
    <div style={{ width: '100%', height: 400 }}> {/* Aumentei um pouco a altura para acomodar bem as 8 barras horizontais */}
      <ResponsiveContainer>
        <BarChart 
          data={data} 
          layout="vertical" // 🔥 Mágica aqui: Inverte o gráfico para horizontal
          margin={{ top: 10, right: 30, left: 60, bottom: 10 }} // Mais espaço na esquerda para a placa
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
          
          {/* Eixo X agora mostra os KM (embaixo) */}
          <XAxis 
            type="number" // Define que este eixo é numérico
            stroke="#94a3b8" 
            fontSize={11}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} // Simplifica para '136k' pra não ocupar espaço
          />
          
          {/* Eixo Y agora mostra as PLACAS (na esquerda) */}
          <YAxis 
            dataKey="placa" 
            type="category" // Define que este eixo é de categorias (texto)
            stroke="#e2e8f0" // Cor mais clara para destacar o texto
            fontSize={12} 
            fontWeight="bold"
            interval={0} // Força mostrar todas as placas
            tickLine={false} // Remove as linhazinhas pequenas
            axisLine={false} // Remove a linha principal vertical
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
            labelStyle={{ color: '#fff', marginBottom: '4px' }} // Título do tooltip (a placa) em branco
          />
          
          <Bar 
            dataKey="odometer" 
            fill="#3b82f6" 
            radius={[0, 6, 6, 0]} // Arredonda os cantos da direita das barras horizontais
            barSize={20} // Barras um pouco mais finas para um visual elegante
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}