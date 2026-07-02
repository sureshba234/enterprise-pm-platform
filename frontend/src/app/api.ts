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
    googleLogin: builder.mutation({
      query: (code: string) => ({ url: 'auth/google/', method: 'POST', body: { code } }),
    }),
    githubLogin: builder.mutation({
      query: (code: string) => ({ url: 'auth/github/', method: 'POST', body: { code } }),
    }),
    forgotPassword: builder.mutation({
      query: (email: string) => ({
        url: 'auth/forgot-password/',
        method: 'POST',
        body: { email },
      }),
    }),
    resetPassword: builder.mutation({
      query: ({ uid, token, password }: { uid: string; token: string; password: string }) => ({
        url: `auth/reset-password/${uid}/${token}/`,
        method: 'POST',
        body: { password },
      }),
    }),
    getMfaSetup: builder.query({
      query: () => 'auth/mfa/setup/',
    }),
    enableMfa: builder.mutation({
      query: (code: string) => ({ url: 'auth/mfa/enable/', method: 'POST', body: { code } }),
    }),
    disableMfa: builder.mutation({
      query: () => ({ url: 'auth/mfa/disable/', method: 'POST' }),
    }),
    verifyMfa: builder.mutation({
      query: ({ mfa_token, code }: { mfa_token: string; code: string }) => ({
        url: 'auth/mfa/verify/',
        method: 'POST',
        body: { mfa_token, code },
      }),
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
    getOrgMembers: builder.query({
  query: (orgId: number) => `orgs/${orgId}/members/`,
}),
    getNotifications: builder.query({
  query: (orgId: number) => `orgs/${orgId}/notifications/`,
  providesTags: ['Notification'],
}),
markNotificationRead: builder.mutation({
  query: (notificationId: number) => ({
    url: `notifications/${notificationId}/read/`,
    method: 'PATCH',
  }),
  invalidatesTags: ['Notification'],
}),
markAllNotificationsRead: builder.mutation({
  query: (orgId: number) => ({
    url: `orgs/${orgId}/notifications/mark-all-read/`,
    method: 'PATCH',
  }),
  invalidatesTags: ['Notification'],
}),
    getMessages: builder.query({
      query: (orgId: number) => `orgs/${orgId}/messages/`,
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
  useGoogleLoginMutation,
  useGithubLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetMfaSetupQuery,
  useEnableMfaMutation,
  useDisableMfaMutation,
  useVerifyMfaMutation,
  useGetMeQuery,
  useGetOrgsQuery,
  useCreateOrgMutation,
  useGetProjectsQuery,
  useCreateProjectMutation,
  useGetTasksQuery,
  useCreateTaskMutation,
  useMoveTaskMutation,
  useGetMessagesQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetOrgMembersQuery,
} = api;