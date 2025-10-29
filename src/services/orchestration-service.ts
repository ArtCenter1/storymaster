import { LLMProviderManager, LLMOptions } from '../providers/llm-provider';
import * as fs from 'fs';
import * as path from 'path';

export interface BMADAgent {
  id: string;
  name: string;
  title: string;
  persona: {
    role: string;
    style: string;
    core_principles: string[];
  };
  commands: Record<string, string>;
  dependencies: {
    data?: string[];
    tasks?: string[];
    templates?: string[];
    utils?: string[];
  };
}

export interface AgentSession {
  id: string;
  agentId: string;
  userId: string;
  projectId: string;
  storyFileId: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  llmMetadata: {
    provider: string;
    model: string;
    tokensUsed: number;
    cost: number;
    latency: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface StoryFile {
  id: string;
  projectId: string;
  filename: string;
  content: string;
  version: number;
  metadata: Record<string, any>;
}

export class BMADOrchestrationService {
  private llmManager: LLMProviderManager;
  private agents: Map<string, BMADAgent> = new Map();
  private bmadPath: string;

  constructor(bmadPath: string = '.bmad-creative-writing') {
    this.llmManager = new LLMProviderManager();
    this.bmadPath = bmadPath;
    this.loadAgents();
  }

  private loadAgents(): void {
    const agentsPath = path.join(this.bmadPath, 'agents');
    const agentFiles = fs.readdirSync(agentsPath).filter((file: string) => file.endsWith('.md'));

    for (const file of agentFiles) {
      try {
        const agent = this.parseAgentFile(path.join(agentsPath, file));
        if (agent) {
          this.agents.set(agent.id, agent);
        }
      } catch (error) {
        console.warn(`Failed to load agent ${file}:`, error);
      }
    }
  }

  private parseAgentFile(filePath: string): BMADAgent | null {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract YAML block from markdown
    const yamlMatch = content.match(/```yaml\s*([\s\S]*?)\s*```/);
    if (!yamlMatch) return null;

    try {
      const yamlContent = yamlMatch[1];
      // Simple YAML parsing (in production, use a proper YAML parser)
      const agentData = this.parseSimpleYAML(yamlContent);

      return {
        id: agentData.agent?.id || path.basename(filePath, '.md'),
        name: agentData.agent?.name || '',
        title: agentData.agent?.title || '',
        persona: agentData.persona || { role: '', style: '', core_principles: [] },
        commands: agentData.commands || {},
        dependencies: agentData.dependencies || {},
      };
    } catch (error) {
      console.warn(`Failed to parse agent YAML in ${filePath}:`, error);
      return null;
    }
  }

  private parseSimpleYAML(yaml: string): any {
    // Very basic YAML parser for the agent files
    // In production, use a proper YAML library
    const result: any = {};
    const lines = yaml.split('\n');
    let currentSection = '';
    let currentObject: any = result;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      if (trimmed.endsWith(':')) {
        const key = trimmed.slice(0, -1);
        if (currentSection) {
          currentObject[key] = {};
          currentObject = result[currentSection][key];
        } else {
          currentSection = key;
          result[key] = {};
          currentObject = result[key];
        }
      } else if (trimmed.includes(':')) {
        const [key, ...valueParts] = trimmed.split(':');
        const value = valueParts.join(':').trim();
        currentObject[key.trim()] = value.startsWith('"') && value.endsWith('"')
          ? value.slice(1, -1)
          : value;
      }
    }

    return result;
  }

  async executeAgentAction(
    agentId: string,
    action: string,
    inputs: Record<string, any>,
    storyContext: string,
    options: LLMOptions = {}
  ): Promise<AgentSession> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Load agent dependencies if needed
    await this.loadAgentDependencies(agent);

    // Build prompt from agent persona and action
    const prompt = this.buildAgentPrompt(agent, action, inputs, storyContext);

    // Call LLM
    const llmResponse = await this.llmManager.generateText(prompt, options);

    // Create session record
    const session: AgentSession = {
      id: this.generateId(),
      agentId,
      userId: inputs.userId || 'anonymous',
      projectId: inputs.projectId || 'default',
      storyFileId: inputs.storyFileId || 'default',
      inputs,
      outputs: { response: llmResponse.text },
      llmMetadata: {
        provider: llmResponse.metadata.provider,
        model: llmResponse.metadata.model,
        tokensUsed: llmResponse.tokensUsed,
        cost: llmResponse.cost,
        latency: llmResponse.metadata.latency,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return session;
  }

  private async loadAgentDependencies(agent: BMADAgent): Promise<void> {
    // Load data, tasks, templates, utils as needed
    // For now, just ensure they exist
    for (const depType of ['data', 'tasks', 'templates', 'utils'] as const) {
      if (agent.dependencies[depType]) {
        for (const dep of agent.dependencies[depType]!) {
          const depPath = path.join(this.bmadPath, depType, dep);
          if (!fs.existsSync(depPath)) {
            console.warn(`Dependency not found: ${depPath}`);
          }
        }
      }
    }
  }

  private buildAgentPrompt(
    agent: BMADAgent,
    action: string,
    inputs: Record<string, any>,
    storyContext: string
  ): string {
    return `
You are ${agent.name}, ${agent.persona.role}.

${agent.persona.style}

Core Principles:
${agent.persona.core_principles.map(p => `- ${p}`).join('\n')}

Current Story Context:
${storyContext}

User Request: ${action}

Additional Inputs:
${Object.entries(inputs).map(([k, v]) => `${k}: ${v}`).join('\n')}

Please provide your expert response as ${agent.name}.
    `.trim();
  }

  getAvailableAgents(): BMADAgent[] {
    return Array.from(this.agents.values());
  }

  getAgent(agentId: string): BMADAgent | undefined {
    return this.agents.get(agentId);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}