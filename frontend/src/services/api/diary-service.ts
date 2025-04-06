import { apiClient } from './api-client';

/**
 * Interface for diary entry
 */
export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  location?: string;
  feeling?: string;
  images?: string[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}

/**
 * Interface for diary entry creation
 */
export interface CreateDiaryEntryRequest {
  title: string;
  content: string;
  location?: string;
  feeling?: string;
  images?: File[] | string[];
  tags?: string[];
}

/**
 * Interface for diary entry update
 */
export interface UpdateDiaryEntryRequest {
  title?: string;
  content?: string;
  location?: string;
  feeling?: string;
  images?: File[] | string[];
  tags?: string[];
}

/**
 * Interface for available diary locations
 */
export interface DiaryLocation {
  id: string;
  name: string;
  type: string;
  icon?: string;
}

/**
 * Service for diary entry management
 */
class DiaryService {
  /**
   * Get all diary entries
   * @param page Page number
   * @param limit Results per page
   * @returns Promise with paginated diary entries
   */
  async getDiaryEntries(page = 1, limit = 10): Promise<{
    data: DiaryEntry[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    try {
      const response = await apiClient.get('/diary', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching diary entries:', error);
      throw error;
    }
  }

  /**
   * Get a specific diary entry
   * @param entryId Diary entry ID
   * @returns Promise with diary entry
   */
  async getDiaryEntry(entryId: string): Promise<DiaryEntry> {
    try {
      const response = await apiClient.get(`/diary/${entryId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching diary entry ${entryId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new diary entry
   * @param entry Diary entry data
   * @returns Promise with created diary entry
   */
  async createDiaryEntry(entry: CreateDiaryEntryRequest): Promise<DiaryEntry> {
    try {
      // Check if we have file uploads
      if (entry.images && entry.images.length > 0 && entry.images[0] instanceof File) {
        const formData = new FormData();
        
        // Add each image - Fix type issue with explicit type casting
        (entry.images as File[]).forEach((image, index) => {
          formData.append(`images`, image);
        });
        
        // Add other data fields
        Object.keys(entry).forEach(key => {
          if (key !== 'images') {
            const value = entry[key as keyof CreateDiaryEntryRequest];
            if (value !== undefined) {
              if (Array.isArray(value)) {
                // Handle arrays (like tags)
                value.forEach(item => formData.append(`${key}[]`, item));
              } else {
                formData.append(key, value as string);
              }
            }
          }
        });
        
        const response = await apiClient.post('/diary', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        return response.data;
      } else {
        // Regular JSON request without files
        const response = await apiClient.post('/diary', entry);
        return response.data;
      }
    } catch (error) {
      console.error('Error creating diary entry:', error);
      throw error;
    }
  }

  /**
   * Update a diary entry
   * @param entryId Diary entry ID
   * @param updates Updates to apply
   * @returns Promise with updated diary entry
   */
  async updateDiaryEntry(
    entryId: string,
    updates: UpdateDiaryEntryRequest
  ): Promise<DiaryEntry> {
    try {
      // Check if we have file uploads
      if (updates.images && updates.images.length > 0 && updates.images[0] instanceof File) {
        const formData = new FormData();
        
        // Add each image - Fix type issue with explicit type casting
        (updates.images as File[]).forEach((image, index) => {
          formData.append(`images`, image);
        });
        
        // Add other data fields
        Object.keys(updates).forEach(key => {
          if (key !== 'images') {
            const value = updates[key as keyof UpdateDiaryEntryRequest];
            if (value !== undefined) {
              if (Array.isArray(value)) {
                // Handle arrays (like tags)
                value.forEach(item => formData.append(`${key}[]`, item));
              } else {
                formData.append(key, value as string);
              }
            }
          }
        });
        
        const response = await apiClient.put(`/diary/${entryId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        return response.data;
      } else {
        // Regular JSON request without files
        const response = await apiClient.put(`/diary/${entryId}`, updates);
        return response.data;
      }
    } catch (error) {
      console.error(`Error updating diary entry ${entryId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a diary entry
   * @param entryId Diary entry ID
   * @returns Promise with deletion result
   */
  async deleteDiaryEntry(entryId: string): Promise<any> {
    try {
      const response = await apiClient.delete(`/diary/${entryId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting diary entry ${entryId}:`, error);
      throw error;
    }
  }

  /**
   * Get available diary locations
   * @returns Promise with locations
   */
  async getDiaryLocations(): Promise<DiaryLocation[]> {
    try {
      const response = await apiClient.get('/diary/locations');
      return response.data;
    } catch (error) {
      console.error('Error fetching diary locations:', error);
      throw error;
    }
  }

  /**
   * Search diary entries
   * @param query Search query
   * @param page Page number
   * @param limit Results per page
   * @returns Promise with search results
   */
  async searchDiaryEntries(
    query: string,
    page = 1,
    limit = 10
  ): Promise<{
    data: DiaryEntry[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    try {
      const response = await apiClient.get('/diary/search', {
        params: { query, page, limit }
      });
      return response.data;
    } catch (error) {
      console.error(`Error searching diary entries with query "${query}":`, error);
      throw error;
    }
  }
}

// Create singleton instance
export const diaryService = new DiaryService();

// Default export
export default diaryService;