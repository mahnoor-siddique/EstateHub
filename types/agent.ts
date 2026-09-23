/** Agent shown on listings. Mirrors the planned Supabase `agents` table (Phase 4 adds full profiles). */
export type Agent = {
  id: string;
  fullName: string;
  agencyName: string;
  title: string; // role shown under the name, e.g. "Senior Property Consultant"
  profileImage?: string; // initials are shown until real photos exist
};
