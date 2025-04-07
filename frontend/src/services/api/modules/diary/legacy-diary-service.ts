import axios from 'axios';
import { Diary, DiaryLocation } from '../../../../types/diary';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class DiaryService {
  private getAuthHeader() {
    // Get token from localStorage if in browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        return {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
      }
    }
    return {};
  }

  async getDiaries(): Promise<Diary[]> {
    try {
      console.log('Getting auth headers:', this.getAuthHeader());
      const { data } = await axios.get(`${API_URL}/diary`, this.getAuthHeader());
      return data;
    } catch (error) {
      console.error('Error fetching diaries:', error);
      throw error;
    }
  }

  async getDiary(id: string): Promise<Diary> {
    try {
      const { data } = await axios.get(
        `${API_URL}/diary/${id}`,
        this.getAuthHeader()
      );
      return data;
    } catch (error) {
      console.error(`Error fetching diary with id ${id}:`, error);
      throw error;
    }
  }

  async createDiary(diary: Diary): Promise<Diary> {
    try {
      const { data } = await axios.post(
        `${API_URL}/diary`,
        diary,
        this.getAuthHeader()
      );
      return data;
    } catch (error) {
      console.error('Error creating diary:', error);
      throw error;
    }
  }

  async updateDiary(id: string, diary: Partial<Diary>): Promise<Diary> {
    try {
      const { data } = await axios.put(
        `${API_URL}/diary/${id}`,
        diary,
        this.getAuthHeader()
      );
      return data;
    } catch (error) {
      console.error(`Error updating diary with id ${id}:`, error);
      throw error;
    }
  }

  async deleteDiary(id: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/diary/${id}`, this.getAuthHeader());
    } catch (error) {
      console.error(`Error deleting diary with id ${id}:`, error);
      throw error;
    }
  }

  async getLocations(): Promise<DiaryLocation[]> {
    try {
      const { data } = await axios.get(
        `${API_URL}/diary/locations/list`,
        this.getAuthHeader()
      );
      return data;
    } catch (error) {
      console.error('Error fetching diary locations:', error);
      throw error;
    }
  }
}

export const diaryService = new DiaryService();