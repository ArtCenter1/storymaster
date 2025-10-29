#!/usr/bin/env ts-node

/**
 * StoryMaster SAAS Demo Script
 *
 * This script demonstrates the core functionality of the StoryMaster SAAS platform
 * by simulating a user workflow with BMAD agents.
 */

import { LLMProviderManager } from './src/providers/llm-provider';
import { BMADOrchestrationService } from './src/services/orchestration-service';
import { StoryFileStore } from './src/stores/story-file-store';
import { AuthService } from './src/auth/auth-service';
import { UsageMonitor } from './src/monitoring/usage-monitor';

async function main() {
  console.log('🚀 StoryMaster SAAS Demo Starting...\n');

  // Initialize core services
  const llmManager = new LLMProviderManager();
  const orchestrationService = new BMADOrchestrationService();
  const storyStore = new StoryFileStore();
  const authService = new AuthService();
  const usageMonitor = new UsageMonitor(authService, llmManager, orchestrationService);

  try {
    // 1. User Registration & Authentication
    console.log('📝 Step 1: User Registration');
    const authResult = await authService.register('demo@example.com', 'password123', 'Demo User');
    if (!authResult.success) {
      throw new Error('Registration failed');
    }
    console.log(`✅ User registered: ${authResult.user!.email}\n`);

    // 2. Create a Story Project
    console.log('📚 Step 2: Creating Story Project');
    const storyFile = await storyStore.createStoryFile(
      'demo-project',
      'demo-story.md',
      `# Demo Story

Once upon a time, in a bustling city filled with dreams and ambitions...

[Story content will be generated here]
`,
      { genre: 'fantasy', targetAudience: 'young adult' },
      authResult.user!.id
    );
    console.log(`✅ Story project created: ${storyFile.filename}\n`);

    // 3. Load Available Agents
    console.log('🤖 Step 3: Loading BMAD Agents');
    const agents = orchestrationService.getAvailableAgents();
    console.log(`✅ Loaded ${agents.length} agents:`);
    agents.forEach(agent => {
      console.log(`   - ${agent.title} (${agent.id})`);
    });
    console.log('');

    // 4. Simulate Agent Interactions
    console.log('💬 Step 4: Agent Interactions');

    // Plot Architect - Generate outline
    console.log('🎭 Consulting Plot Architect...');
    const plotSession = await orchestrationService.executeAgentAction(
      'plot-architect',
      'Create a compelling plot outline for a fantasy story about a young hero discovering their magical powers',
      {
        userId: authResult.user!.id,
        projectId: 'demo-project',
        storyFileId: storyFile.id,
        genre: 'fantasy',
        theme: 'self-discovery',
      },
      storyFile.content
    );

    usageMonitor.recordSession(plotSession);
    console.log(`✅ Plot outline generated (${plotSession.llmMetadata.tokensUsed} tokens)\n`);

    // Character Psychologist - Develop main character
    console.log('🧠 Consulting Character Psychologist...');
    const characterSession = await orchestrationService.executeAgentAction(
      'character-psychologist',
      'Develop a detailed character profile for the protagonist',
      {
        userId: authResult.user!.id,
        projectId: 'demo-project',
        storyFileId: storyFile.id,
        characterRole: 'protagonist',
        age: '16',
        background: 'ordinary teenager',
      },
      storyFile.content
    );

    usageMonitor.recordSession(characterSession);
    console.log(`✅ Character profile developed (${characterSession.llmMetadata.tokensUsed} tokens)\n`);

    // Editor - Review and improve writing
    console.log('✏️ Consulting Editor...');
    const editorSession = await orchestrationService.executeAgentAction(
      'editor',
      'Review the story opening and suggest improvements for engagement',
      {
        userId: authResult.user!.id,
        projectId: 'demo-project',
        storyFileId: storyFile.id,
        focusArea: 'opening hook',
      },
      storyFile.content
    );

    usageMonitor.recordSession(editorSession);
    console.log(`✅ Story opening reviewed (${editorSession.llmMetadata.tokensUsed} tokens)\n`);

    // 5. Update Story with Agent Suggestions
    console.log('💾 Step 5: Updating Story File');
    const updatedContent = `# Demo Story

${plotSession.outputs.response}

## Main Character
${characterSession.outputs.response}

## Opening Scene
${editorSession.outputs.response}

[Continue the story...]
`;

    await storyStore.updateStoryFile(
      storyFile.id,
      updatedContent,
      'Incorporated agent suggestions',
      authResult.user!.id
    );
    console.log('✅ Story file updated with agent contributions\n');

    // 6. Show Usage Metrics
    console.log('📊 Step 6: Usage Analytics');
    const metrics = usageMonitor.getGlobalMetrics();
    console.log(`📈 Session Summary:`);
    console.log(`   - Total Tokens Used: ${metrics.totalTokensUsed}`);
    console.log(`   - Total Cost: $${metrics.totalCost.toFixed(2)}`);
    console.log(`   - Average Response Time: ${metrics.responseTime.average.toFixed(0)}ms`);
    console.log(`   - Error Rate: ${metrics.errorRate.toFixed(2)}%\n`);

    // 7. Show Version History
    console.log('📚 Step 7: Version History');
    const versions = await storyStore.getVersions(storyFile.id);
    console.log(`📝 Story has ${versions.length} versions:`);
    versions.forEach(version => {
      console.log(`   v${version.version}: ${version.commitMessage} (${version.createdAt.toLocaleString()})`);
    });
    console.log('');

    // 8. System Health Check
    console.log('🏥 Step 8: System Health Check');
    const health = usageMonitor.getSystemHealth();
    console.log(`🔍 System Status: ${health.status.toUpperCase()}`);
    console.log(`⏱️ Uptime: ${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m`);
    if (health.alerts.length > 0) {
      console.log(`⚠️ Alerts: ${health.alerts.join(', ')}`);
    }
    console.log('');

    console.log('🎉 Demo completed successfully!');
    console.log('\n💡 Key Features Demonstrated:');
    console.log('   ✅ BMAD agent orchestration');
    console.log('   ✅ Multi-provider LLM abstraction');
    console.log('   ✅ Versioned story file storage');
    console.log('   ✅ Real-time usage monitoring');
    console.log('   ✅ User authentication & billing');
    console.log('   ✅ Collaborative writing workflow');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    // process.exit(1); // Commented out for browser compatibility
  }
}

// Run the demo
// if (require.main === module) { // Commented out for browser compatibility
  main().catch(console.error);
// }

export { main as runDemo };