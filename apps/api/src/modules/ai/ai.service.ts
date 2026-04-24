import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';

export interface AiInvokeBody {
  action?: string;
  file_url?: string;
  json_schema?: unknown;
  prompt?: string;
  file_urls?: string[];
  response_json_schema?: unknown;
  function?: string;
  agent_id?: string;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      quoted = !quoted;
      continue;
    }
    if (c === ',' && !quoted) {
      result.push(cur.trim());
      cur = '';
      continue;
    }
    cur += c;
  }
  result.push(cur.trim());
  return result.map((s) => s.replace(/^"|"$/g, '').trim());
}

@Injectable()
export class AiService {
  private readonly log = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
    private readonly config: ConfigService,
  ) {}

  async invoke(raw: Record<string, unknown>): Promise<unknown> {
    const body = raw as AiInvokeBody;
    if (body?.action === 'ExtractDataFromUploadedFile') {
      return this.extractDataFromUploadedFile(body.file_url, body.json_schema);
    }
    if (body?.function === 'executeAIAgent' && body.agent_id) {
      return this.executeAiAgent(body.agent_id);
    }
    if (body?.prompt && Array.isArray(body.file_urls)) {
      return this.invokeLlmJson(body.prompt, body.file_urls, body.response_json_schema);
    }
    throw new BadRequestException('Unsupported ai/invoke payload');
  }

  private async extractDataFromUploadedFile(
    fileUrl: string | undefined,
    _jsonSchema: unknown,
  ): Promise<{ status: string; output: { rows: Record<string, string>[] } }> {
    if (!fileUrl) throw new BadRequestException('file_url is required');
    let text: string;
    try {
      text = await this.uploads.readFileText(fileUrl);
    } catch (e) {
      this.log.warn(`Could not read upload as text: ${e}`);
      throw new BadRequestException('Could not read file (try CSV UTF-8)');
    }
    const rows = this.parseCsvToObjects(text);
    return { status: 'success', output: { rows } };
  }

  private parseCsvToObjects(csv: string): Record<string, string>[] {
    const normalized = csv.replace(/^\uFEFF/, '');
    const lines = normalized
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) return [];
    const headers = parseCsvLine(lines[0]);
    const result: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = parseCsvLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((h, j) => {
        row[h] = cells[j] ?? '';
      });
      result.push(row);
    }
    return result;
  }

  private async invokeLlmJson(
    prompt: string,
    fileUrls: string[],
    _schema: unknown,
  ): Promise<Record<string, unknown>> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    let fileContext = '';
    for (const url of fileUrls) {
      try {
        const t = await this.uploads.readFileText(url);
        fileContext += `\n\n--- file ---\n${t.slice(0, 120_000)}`;
      } catch {
        fileContext += `\n\n--- file (unreadable as text) ---\n${url}`;
      }
    }

    if (!apiKey) {
      this.log.warn('OPENAI_API_KEY not set; returning stub JSON for prompt invoke');
      return {
        steps: [
          {
            name: 'Review uploaded document',
            optional: false,
            tasks: [{ label: 'Confirm work scope with customer', type: 'checkbox', required: true }],
          },
        ],
        required_skills: ['General field service'],
        default_duration_hrs: 2,
        duration_reason: 'Stub response — configure OPENAI_API_KEY for real AI output.',
      };
    }

    const model = this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: 'user',
            content: `${prompt}${fileContext}\n\nReply with JSON only, no markdown.`,
          },
        ],
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      this.log.error(`OpenAI error ${res.status}: ${errText}`);
      throw new BadRequestException('AI provider error');
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? '';
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    try {
      return JSON.parse(jsonStr) as Record<string, unknown>;
    } catch {
      throw new BadRequestException('AI returned non-JSON');
    }
  }

  private async executeAiAgent(agentId: string): Promise<{
    data: {
      result: {
        actions_executed?: number;
        actions?: Array<{ order_number?: string; assigned_to?: string; reason?: string }>;
        llm_summary?: string;
        reason?: string;
      };
      error?: string;
    };
  }> {
    const agent = await this.prisma.aIAgent.findUnique({ where: { id: agentId } });
    if (!agent) {
      return { data: { result: {}, error: 'Agent not found' } };
    }
    await this.prisma.aIAgent.update({
      where: { id: agentId },
      data: { last_run_at: new Date(), last_run_summary: 'Dry run (no automatic mutations)' },
    });
    return {
      data: {
        result: {
          actions_executed: 0,
          actions: [],
          llm_summary: `Agent "${agent.name}" executed in dry-run mode. Connect LLM or add rules to perform reassignments.`,
          reason: 'stub',
        },
      },
    };
  }
}
