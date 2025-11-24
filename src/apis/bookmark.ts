import instance from '../utils/axiosInstance';

interface BookmarkHospitalData {
  id: number;
  name: string;
  specialties: string[];
  imageUrl: string | null;
  address: string;
  operatingHours: Array<{
    dayOfWeek: string;
    openTime?: string;
    closeTime?: string;
    breakStartTime?: string;
    breakEndTime?: string;
    isClosed: boolean;
  }>;
  bookmark: boolean;
  contact: string;
}

interface GetBookmarksResponse {
  isSuccess: boolean;
  message: string;
  data: {
    totalCount: number;
    hospitals: BookmarkHospitalData[];
  };
}

interface PostBookmarkResponse {
  isSuccess: boolean;
  message: string;
}

interface DeleteBookmarkResponse {
  isSuccess: boolean;
  message: string;
}

// GET: 즐겨찾기한 병원 목록 조회
export const getBookmarkedHospitalsApi = async () => {
  const response = await instance.get<GetBookmarksResponse>('/api/patients/bookmarks');
  return response.data;
};

// POST: 병원을 즐겨찾기에 추가
export const addBookmarkApi = async (hospitalId: number) => {
  const response = await instance.post<PostBookmarkResponse>('/api/patients/bookmarks', {}, {
    params: {
      hospitalId,
    },
  });
  return response.data;
};

// DELETE: 즐겨찾기 제거
export const deleteBookmarkApi = async (hospitalId: number) => {
  const response = await instance.delete<DeleteBookmarkResponse>('/api/patients/bookmarks', {
    params: {
      hospitalId,
    },
  });
  return response.data;
};
