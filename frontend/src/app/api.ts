import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://127.0.0.1:8000/api/',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('access');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Organization', 'Project', 'Task'],
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (body) => ({ url: 'auth/register/', method: 'POST', body }),
    }),
    login: builder.mutation({
      query: (body) => ({ url: 'auth/login/', method: 'POST', body }),
    }),
    getMe: builder.query({
      query: () => 'auth/me/',
    }),
    getOrgs: builder.query({
      query: () => 'orgs/',
      providesTags: ['Organization'],
    }),
    createOrg: builder.mutation({
      query: (body) => ({ url: 'orgs/', method: 'POST', body }),
      invalidatesTags: ['Organization'],
    }),
    getProjects: builder.query({
      query: (orgId: number) => `orgs/${orgId}/projects/`,
      providesTags: ['Project'],
    }),
    createProject: builder.mutation({
      query: ({ orgId, ...body }) => ({
        url: `orgs/${orgId}/projects/`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Project'],
    }),
    getTasks: builder.query({
      query: (projectId: number) => `projects/${projectId}/tasks/`,
      providesTags: ['Task'],
    }),
    createTask: builder.mutation({
      query: ({ projectId, ...body }) => ({
        url: `projects/${projectId}/tasks/`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Task'],
    }),
    moveTask: builder.mutation({
      query: ({ taskId, ...body }) => ({
        url: `tasks/${taskId}/move/`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Task'],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useGetMeQuery,
  useGetOrgsQuery,
  useCreateOrgMutation,
  useGetProjectsQuery,
  useCreateProjectMutation,
  useGetTasksQuery,
  useCreateTaskMutation,
  useMoveTaskMutation,
} = api;