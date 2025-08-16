import { Injectable } from '@nestjs/common';

@Injectable()
export class PythonMockService {
  async ingestDocuments(documents: any[]): Promise<{ success: boolean; error?: string }> {
    // Simulate processing time
    await this.delay(2000 + Math.random() * 3000); // 2-5 seconds

    // Simulate 90% success rate
    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
      console.log(`Successfully ingested ${documents.length} documents`);
      return { success: true };
    } else {
      return { 
        success: false, 
        error: 'Failed to process documents - simulation error' 
      };
    }
  }

  async queryDocuments(query: string, documentIds?: string[]): Promise<any> {
    // Simulate RAG query processing
    await this.delay(1000 + Math.random() * 2000); // 1-3 seconds

    return {
      query,
      answer: `This is a mock answer for: "${query}". In a real implementation, this would use RAG to retrieve relevant document chunks and generate an answer using an LLM.`,
      relevantDocuments: documentIds?.slice(0, 3) || [],
      confidence: Math.random() * 0.4 + 0.6, // 60-100%
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}