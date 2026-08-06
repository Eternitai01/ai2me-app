import apiService from "@/lib/axios";

const base = "/auth/settings";

export type UpdateCompanyDetailsRequest = {
  companyName?: string;
  industry?: string;
  companySize?: string;
  companyDescription?: string;
  website?: string;
  primaryContact?: string;
  phone?: string;
  timezone?: string;
};

export type UpdateCompanyDetailsResponse = {
  message: string;
};

export type CompanyDetailsResponse = {
  companyName: string;
  industry: string;
  companySize: string;
  companyDescription: string;
  website?: string;
  primaryContact: string;
  email: string;
  phone: string;
  timezone: string;
  is_primary: boolean;
  contactImageUrl?: string;
};

export type TeamMember = {
  id?: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  last_login_at: string | null;
};

export type TeamResponse = TeamMember[];

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordResponse = {
  message: string;
};

export type UploadContactImageResponse = {
  message: string;
  imageUrl: string;
};

export const settingsService = {
  getCompanyDetails: async () => {
    return apiService.get<CompanyDetailsResponse>(
      `${base}/company`,
      undefined,
      { withAuth: true }
    );
  },
  updateCompanyDetails: async (payload: UpdateCompanyDetailsRequest) => {
    return apiService.put<UpdateCompanyDetailsResponse>(
      `${base}/edit`,
      payload,
      undefined,
      { withAuth: true }
    );
  },
  uploadContactImage: async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return apiService.post<UploadContactImageResponse>(
      `${base}/contact-image`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
      { withAuth: true }
    );
  },
  getTeamMembers: async () => {
    return apiService.get<TeamResponse>(`${base}/team`, undefined, {
      withAuth: true,
    });
  },
  // Fetch all users in the same organization to invite
  getOrganizationUsers: async () => {
    return apiService.get<TeamResponse>(
      `${base}/organization-users`,
      undefined,
      { withAuth: true }
    );
  },
  createInvite: async (email: string, role: string) => {
    return apiService.post<{
      message: string;
      invite_hash: string;
      invite_url: string;
      expires_at: string;
    }>(`${base}/invite`, { email, role }, undefined, { withAuth: true });
  },
  deleteTeamMember: async (userId: string) => {
    return apiService.delete<unknown>(`${base}/team/${userId}`, undefined, {
      withAuth: true,
    });
  },
  changePassword: async (payload: ChangePasswordRequest) => {
    return apiService.post<ChangePasswordResponse>(
      `/auth/change-password`,
      {
        current_password: payload.currentPassword,
        new_password: payload.newPassword,
      },
      undefined,
      { withAuth: true }
    );
  },
};

export default settingsService;
