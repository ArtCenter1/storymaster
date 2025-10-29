import { StoryFile } from '../services/orchestration-service';

export interface StoryFileVersion {
  id: string;
  storyFileId: string;
  version: number;
  content: string;
  metadata: Record<string, any>;
  createdAt: Date;
  createdBy: string;
  commitMessage?: string;
}

export interface StoryFileDiff {
  additions: number;
  deletions: number;
  changes: Array<{
    type: 'add' | 'delete' | 'modify';
    lineNumber: number;
    content: string;
  }>;
}

export class StoryFileStore {
  private storyFiles: Map<string, StoryFile> = new Map();
  private versions: Map<string, StoryFileVersion[]> = new Map();

  async createStoryFile(
    projectId: string,
    filename: string,
    initialContent: string = '',
    metadata: Record<string, any> = {},
    createdBy: string = 'system'
  ): Promise<StoryFile> {
    const id = this.generateId();
    const storyFile: StoryFile = {
      id,
      projectId,
      filename,
      content: initialContent,
      version: 1,
      metadata,
    };

    this.storyFiles.set(id, storyFile);

    // Create initial version
    await this.createVersion(storyFile, 'Initial creation', createdBy);

    return storyFile;
  }

  async updateStoryFile(
    storyFileId: string,
    newContent: string,
    commitMessage: string = 'Updated content',
    updatedBy: string = 'system',
    metadata: Record<string, any> = {}
  ): Promise<StoryFile> {
    const storyFile = this.storyFiles.get(storyFileId);
    if (!storyFile) {
      throw new Error(`Story file ${storyFileId} not found`);
    }

    // Only update if content has changed
    if (storyFile.content === newContent) {
      return storyFile;
    }

    storyFile.content = newContent;
    storyFile.version += 1;
    storyFile.metadata = { ...storyFile.metadata, ...metadata };

    await this.createVersion(storyFile, commitMessage, updatedBy);

    return storyFile;
  }

  async getStoryFile(storyFileId: string): Promise<StoryFile | null> {
    return this.storyFiles.get(storyFileId) || null;
  }

  async getStoryFilesByProject(projectId: string): Promise<StoryFile[]> {
    return Array.from(this.storyFiles.values()).filter(sf => sf.projectId === projectId);
  }

  async getVersions(storyFileId: string): Promise<StoryFileVersion[]> {
    return this.versions.get(storyFileId) || [];
  }

  async getVersion(storyFileId: string, version: number): Promise<StoryFileVersion | null> {
    const versions = this.versions.get(storyFileId) || [];
    return versions.find(v => v.version === version) || null;
  }

  async revertToVersion(
    storyFileId: string,
    targetVersion: number,
    commitMessage: string = `Reverted to version ${targetVersion}`,
    revertedBy: string = 'system'
  ): Promise<StoryFile> {
    const targetVersionData = await this.getVersion(storyFileId, targetVersion);
    if (!targetVersionData) {
      throw new Error(`Version ${targetVersion} not found for story file ${storyFileId}`);
    }

    return this.updateStoryFile(
      storyFileId,
      targetVersionData.content,
      commitMessage,
      revertedBy,
      { revertedFrom: targetVersion }
    );
  }

  async getDiff(storyFileId: string, fromVersion: number, toVersion: number): Promise<StoryFileDiff> {
    const fromVersionData = await this.getVersion(storyFileId, fromVersion);
    const toVersionData = await this.getVersion(storyFileId, toVersion);

    if (!fromVersionData || !toVersionData) {
      throw new Error('One or both versions not found');
    }

    // Simple diff implementation (in production, use a proper diff library)
    return this.computeSimpleDiff(fromVersionData.content, toVersionData.content);
  }

  async deleteStoryFile(storyFileId: string): Promise<boolean> {
    const deleted = this.storyFiles.delete(storyFileId);
    if (deleted) {
      this.versions.delete(storyFileId);
    }
    return deleted;
  }

  private async createVersion(
    storyFile: StoryFile,
    commitMessage: string,
    createdBy: string
  ): Promise<void> {
    const version: StoryFileVersion = {
      id: this.generateId(),
      storyFileId: storyFile.id,
      version: storyFile.version,
      content: storyFile.content,
      metadata: storyFile.metadata,
      createdAt: new Date(),
      createdBy,
      commitMessage,
    };

    const versions = this.versions.get(storyFile.id) || [];
    versions.push(version);
    this.versions.set(storyFile.id, versions);
  }

  private computeSimpleDiff(oldContent: string, newContent: string): StoryFileDiff {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');

    const changes: StoryFileDiff['changes'] = [];
    let additions = 0;
    let deletions = 0;

    // Very basic diff - in production use a proper diff algorithm
    const maxLines = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];

      if (oldLine === undefined && newLine !== undefined) {
        changes.push({ type: 'add', lineNumber: i + 1, content: newLine });
        additions++;
      } else if (oldLine !== undefined && newLine === undefined) {
        changes.push({ type: 'delete', lineNumber: i + 1, content: oldLine });
        deletions++;
      } else if (oldLine !== newLine) {
        changes.push({ type: 'modify', lineNumber: i + 1, content: newLine });
        additions++;
        deletions++;
      }
    }

    return { additions, deletions, changes };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Persistence methods (in production, these would interact with a database)
  async saveToDisk(basePath: string = './data/story-files'): Promise<void> {
    // Implementation for saving to disk
    // In production, this would be database operations
  }

  async loadFromDisk(basePath: string = './data/story-files'): Promise<void> {
    // Implementation for loading from disk
    // In production, this would be database operations
  }
}