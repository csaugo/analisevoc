
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generatePDFContent } from '@/lib/pdf-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const analysis = await prisma.analysis.findUnique({
      where: { id: params.id },
      include: {
        company: true
      }
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Análise não encontrada' },
        { status: 404 }
      );
    }

    const pdfData = {
      companyName: analysis.company.name,
      analysis: {
        totalTweets: analysis.totalTweets,
        positiveTweets: analysis.positiveTweets,
        negativeTweets: analysis.negativeTweets,
        neutralTweets: analysis.neutralTweets,
        sentimentScore: analysis.sentimentScore,
        engagementRate: analysis.engagementRate,
        reachEstimate: analysis.reachEstimate,
        topTopics: analysis.topTopics as string[],
        insights: analysis.insights as string[]
      },
      competitors: analysis.competitors as Array<{
        name: string;
        sentimentScore: number;
        totalMentions: number;
      }>,
      createdAt: analysis.createdAt.toISOString()
    };

    const htmlContent = generatePDFContent(pdfData);

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="relatorio-voc-${analysis.company.name}-${new Date().toISOString().split('T')[0]}.html"`
      }
    });
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
