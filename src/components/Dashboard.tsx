import React, { useState, useEffect } from 'react';

declare const React: any;

interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  lastModified: Date;
  storyCount: number;
}

interface DashboardProps {
  userId: string;
  onCreateProject: () => void;
  onOpenProject: (projectId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  userId,
  onCreateProject,
  onOpenProject,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, [userId]);

  const loadProjects = async () => {
    try {
      // In production, this would call an API
      const mockProjects: Project[] = [
        {
          id: '1',
          title: 'My Fantasy Novel',
          description: 'A tale of magic and adventure',
          createdAt: new Date('2024-01-15'),
          lastModified: new Date('2024-01-20'),
          storyCount: 3,
        },
        {
          id: '2',
          title: 'Sci-Fi Short Stories',
          description: 'Collection of futuristic tales',
          createdAt: new Date('2024-02-01'),
          lastModified: new Date('2024-02-10'),
          storyCount: 5,
        },
      ];
      setProjects(mockProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">StoryMaster Dashboard</h1>
          <p className="text-gray-600 mt-2">Create and manage your story projects</p>
        </div>
        <button
          onClick={onCreateProject}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-500 mb-6">Get started by creating your first story project</p>
          <button
            onClick={onCreateProject}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onOpenProject(project.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-sm text-gray-500">
                  {project.storyCount} stories
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {project.title}
              </h3>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {project.description}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Created {project.createdAt.toLocaleDateString()}</span>
                <span>Modified {project.lastModified.toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Usage Stats */}
      <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage This Month</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">2,450</div>
            <div className="text-sm text-gray-600">Words Generated</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">15</div>
            <div className="text-sm text-gray-600">Agent Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">$3.25</div>
            <div className="text-sm text-gray-600">Cost</div>
          </div>
        </div>
      </div>
    </div>
  );
};