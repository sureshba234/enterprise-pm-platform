import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  useGetOrgsQuery,
  useCreateOrgMutation,
  useGetProjectsQuery,
  useCreateProjectMutation,
} from '../app/api';
import { setSelectedOrg } from '../app/orgSlice';
import type { RootState } from '../app/store';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const selectedOrgId = useSelector((state: RootState) => state.org.selectedOrgId);

  const { data: orgs, isLoading: orgsLoading } = useGetOrgsQuery(undefined);
  const [createOrg] = useCreateOrgMutation();
  const [newOrgName, setNewOrgName] = useState('');

  const { data: projects, isLoading: projectsLoading } = useGetProjectsQuery(
    selectedOrgId!,
    { skip: !selectedOrgId }
  );
  const [createProject] = useCreateProjectMutation();
  const [newProjectName, setNewProjectName] = useState('');

  // Auto-select the first org once orgs load, if nothing is selected yet
  useEffect(() => {
    if (!selectedOrgId && orgs && orgs.length > 0) {
      dispatch(setSelectedOrg(orgs[0].id));
    }
  }, [orgs, selectedOrgId, dispatch]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    const result = await createOrg({ name: newOrgName }).unwrap();
    setNewOrgName('');
    dispatch(setSelectedOrg(result.id));
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !selectedOrgId) return;
    await createProject({ orgId: selectedOrgId, name: newProjectName });
    setNewProjectName('');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="flex gap-4 mb-4">
        <Link to="/dashboard" className="text-sm text-blue-400 hover:underline">Dashboard</Link>
        <Link to="/chat" className="text-sm text-blue-400 hover:underline">Chat</Link>
      </div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Org switcher */}
      <div className="mb-8 bg-slate-800 p-4 rounded-lg">
        <h2 className="text-sm text-slate-400 mb-2">Organization</h2>
        {orgsLoading ? (
          <p>Loading organizations...</p>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            {orgs?.map((org: any) => (
              <button
                key={org.id}
                onClick={() => dispatch(setSelectedOrg(org.id))}
                className={`px-4 py-2 rounded ${
                  selectedOrgId === org.id
                    ? 'bg-blue-600'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                {org.name}
              </button>
            ))}

            <form onSubmit={handleCreateOrg} className="flex gap-2 ml-4">
              <input
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="New org name"
                className="px-3 py-2 rounded bg-slate-700 border border-slate-600 text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-sm"
              >
                + Create Org
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Project list */}
      <div className="bg-slate-800 p-4 rounded-lg">
        <h2 className="text-sm text-slate-400 mb-2">Projects</h2>

        {!selectedOrgId ? (
          <p className="text-slate-500">Select or create an organization first.</p>
        ) : projectsLoading ? (
          <p>Loading projects...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {projects?.map((project: any) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="bg-slate-700 p-4 rounded-lg hover:bg-slate-600 cursor-pointer"
                >
                  <h3 className="font-semibold">{project.name}</h3>
                  <p className="text-sm text-slate-400">{project.status}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleCreateProject} className="flex gap-2">
              <input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="New project name"
                className="px-3 py-2 rounded bg-slate-700 border border-slate-600 text-sm flex-1 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-sm"
              >
                + Create Project
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}