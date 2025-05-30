export interface ProfileData {
  id?: string;
  name: string;
  gender: '남성' | '여성' | '';
  age: string;
  height: string;
  weight: string;
  university: string;
  gpa: string;
  languageScore: string;
  videoUri?: string;
  photoUri?: string;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
} 