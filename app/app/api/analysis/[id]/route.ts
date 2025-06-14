
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const analysis = await prisma.analysis.findUnique({
      where: { id: params.id },
      include: {
        company: true,
        tweets: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Análise não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Erro ao buscar análise:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se a análise existe
    const existingAnalysis = await prisma.analysis.findUnique({
      where: { id: params.id },
      include: { company: true }
    });

    if (!existingAnalysis) {
      return NextResponse.json(
        { error: 'Análise não encontrada' },
        { status: 404 }
      );
    }

    // Excluir a análise (os tweets serão excluídos automaticamente devido ao onDelete: Cascade)
    await prisma.analysis.delete({
      where: { id: params.id }
    });

    // Verificar se a empresa ainda tem outras análises
    const remainingAnalyses = await prisma.analysis.count({
      where: { companyId: existingAnalysis.companyId }
    });

    // Se não há mais análises para esta empresa, excluir a empresa também
    if (remainingAnalyses === 0) {
      await prisma.company.delete({
        where: { id: existingAnalysis.companyId }
      });
    }

    return NextResponse.json(
      { 
        message: 'Análise excluída com sucesso',
        deletedAnalysisId: params.id,
        companyDeleted: remainingAnalyses === 0
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao excluir análise:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
