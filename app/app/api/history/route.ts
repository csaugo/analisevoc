
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const analyses = await prisma.analysis.findMany({
      include: {
        company: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limitar a 50 análises mais recentes
    });

    return NextResponse.json(analyses);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
