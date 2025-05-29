import React, { useEffect, useState, useCallback } from 'react';
import { NextPage } from 'next';
import { Diary } from "../../types/diary";
import { diaryService } from "../../services/api/modules/diary";
import DiaryCard from "../../components/diary/DiaryCard";
import Layout from "../../components/layout/Layout";
import { DiaryLocationLabels, FeelingOptions, DiaryLocationEnum, ExtendedDiary } from "../../types/diaryExtended";
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from "@/contexts/AuthProvider";
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
// Add import for CSS styles
import styles from "../../styles/DiaryList.module.css";

const DiaryListPage: NextPage = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [diaries, setDiaries] = useState<ExtendedDiary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<{
    location?: string;
    feeling?: string;
    gameLevel?: number;
  }>({});

  // Move fetchDiaries declaration before it's used in useEffect
  const fetchDiaries = useCallback(async () => {
    try {
      setLoading(true);
      const response = await diaryService.getDiaryEntries();
      
      // Convert DiaryEntry[] to ExtendedDiary[] by ensuring location properties are compatible
      const extendedDiaries: ExtendedDiary[] = response.data.map(diary => ({
        ...diary,
        location: typeof diary.location === 'string' 
          ? diary.location
          : (diary.location || { name: 'Unknown', latitude: 0, longitude: 0 })
      }));
      
      setDiaries(extendedDiaries);
    } catch (error) {
      console.error('Error fetching diaries:', error);
      setError('Failed to load diaries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch diaries if the user is authenticated
    if (isAuthenticated) {
      fetchDiaries();
    } else if (!loading) {
      setError('Please log in to access your diary entries');
    }
  }, [isAuthenticated, fetchDiaries, loading]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this diary entry?')) {
      try {
        await diaryService.deleteDiary(id);
        setDiaries(diaries.filter(diary => diary.id !== id));
      } catch (err) {
        console.error('Failed to delete diary:', err);
        alert('Failed to delete the diary entry. Please try again.');
      }
    }
  };

  const getDiaryLocation = (diary: ExtendedDiary): string => {
    // Handle both string locations (enum values) and complex DiaryLocation objects
    if (typeof diary.location === 'string') {
      return diary.location;
    } else if (diary.location && typeof diary.location === 'object') {
      return diary.location.name || 'Unknown';
    }
    return 'Unknown';
  };

  const filteredDiaries = diaries.filter(diary => {
    let matches = true;
    
    if (filter.location && getDiaryLocation(diary) !== filter.location) {
      matches = false;
    }
    
    if (filter.feeling && diary.feeling !== filter.feeling) {
      matches = false;
    }
    
    if (filter.gameLevel && diary.gameLevel !== filter.gameLevel) {
      matches = false;
    }
    
    return matches;
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFilter({
      ...filter,
      [name]: value === "" ? undefined : value,
    });
  };

  const clearFilters = () => {
    setFilter({});
  };

  return (
    <Layout>
      <div className={styles.diaryListContainer}>
        <div className={styles.headerSection}>
          <h1>{t('diary')}</h1>
          {isAuthenticated && (
            <Link href="/diary/create" className="btn btn-primary">
              <i className="fa fa-plus"></i> New Entry
            </Link>
          )}
        </div>
        
        {error && (
          <div className="alert alert-danger">{error}</div>
        )}

        {!isAuthenticated && (
          <div className="text-center mt-5">
            <p>You need to be logged in to view your diary entries.</p>
            <Link href="/login?returnUrl=/diary" className="btn btn-primary mt-3">
              {t('login')}
            </Link>
          </div>
        )}
        
        {isAuthenticated && (
          <>
            <div className={styles.filtersContainer}>
              <div className="row">
                <div className="col-md-4">
                  <div className="form-group">
                    <label>Filter by Location</label>
                    <select 
                      className="form-select" 
                      name="location"
                      value={filter.location || ""}
                      onChange={handleFilterChange}
                    >
                      <option value="">All Locations</option>
                      {Object.values(DiaryLocationEnum).map(loc => (
                        <option key={loc} value={loc}>
                          {DiaryLocationLabels[loc] || loc}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="form-group">
                    <label>Game Level</label>
                    <input 
                      type="number" 
                      className="form-control"
                      placeholder="Filter by level"
                      name="gameLevel"
                      value={filter.gameLevel || ""}
                      onChange={(e) => setFilter({
                        ...filter,
                        gameLevel: e.target.value ? Number(e.target.value) : undefined
                      })}
                    />
                  </div>
                </div>
                
                <div className="col-md-4 d-flex align-items-end">
                  <button 
                    className="btn btn-outline-secondary" 
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className={styles.loadingContainer}>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <>
                {filteredDiaries.length === 0 ? (
                  <div className={styles.noDiaries}>
                    <p>No diary entries found. Create your first entry!</p>
                    <Link href="/diary/create" className="btn btn-primary">
                      Create Diary Entry
                    </Link>
                  </div>
                ) : (
                  <div className={styles.diaryGrid}>
                    {filteredDiaries.map(diary => (
                      <DiaryCard 
                        key={diary.id} 
                        diary={diary}
                        onDelete={handleDelete} 
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export async function getServerSideProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}

export default DiaryListPage;