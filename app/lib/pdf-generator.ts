
export interface PDFData {
  companyName: string;
  analysis: {
    totalTweets: number;
    positiveTweets: number;
    negativeTweets: number;
    neutralTweets: number;
    sentimentScore: number;
    engagementRate: number;
    reachEstimate: number;
    topTopics: string[];
    insights: string[];
  };
  competitors: Array<{
    name: string;
    sentimentScore: number;
    totalMentions: number;
  }>;
  createdAt: string;
}

export function generatePDFContent(data: PDFData): string {
  const date = new Date(data.createdAt).toLocaleDateString('pt-BR');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório Voz do Cliente - ${data.companyName}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
    .section { margin-bottom: 30px; }
    .metric { display: inline-block; margin: 10px 20px; text-align: center; }
    .metric-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
    .metric-label { font-size: 12px; color: #666; }
    .positive { color: #10b981; }
    .negative { color: #ef4444; }
    .neutral { color: #6b7280; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background-color: #f9fafb; font-weight: bold; }
    .insights { background-color: #f0f9ff; padding: 20px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Relatório de Análise Voz do Cliente</h1>
    <h2>${data.companyName}</h2>
    <p>Gerado em: ${date}</p>
  </div>

  <div class="section">
    <h3>Resumo Executivo</h3>
    <div class="metric">
      <div class="metric-value">${data.analysis.totalTweets}</div>
      <div class="metric-label">Total de Menções</div>
    </div>
    <div class="metric">
      <div class="metric-value positive">${data.analysis.positiveTweets}</div>
      <div class="metric-label">Positivas</div>
    </div>
    <div class="metric">
      <div class="metric-value negative">${data.analysis.negativeTweets}</div>
      <div class="metric-label">Negativas</div>
    </div>
    <div class="metric">
      <div class="metric-value neutral">${data.analysis.neutralTweets}</div>
      <div class="metric-label">Neutras</div>
    </div>
    <div class="metric">
      <div class="metric-value">${(data.analysis.sentimentScore * 100).toFixed(1)}%</div>
      <div class="metric-label">Score de Sentimento</div>
    </div>
  </div>

  <div class="section">
    <h3>Principais Tópicos Mencionados</h3>
    <ul>
      ${data.analysis.topTopics.map(topic => `<li>${topic}</li>`).join('')}
    </ul>
  </div>

  <div class="section">
    <h3>Comparação com Concorrentes</h3>
    <table>
      <thead>
        <tr>
          <th>Empresa</th>
          <th>Score de Sentimento</th>
          <th>Total de Menções</th>
        </tr>
      </thead>
      <tbody>
        ${data.competitors.map(comp => `
          <tr>
            <td>${comp.name}</td>
            <td>${(comp.sentimentScore * 100).toFixed(1)}%</td>
            <td>${comp.totalMentions}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h3>Insights e Recomendações</h3>
    <div class="insights">
      ${data.analysis.insights.map(insight => `<p>• ${insight}</p>`).join('')}
    </div>
  </div>
</body>
</html>
  `;
}
