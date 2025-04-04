import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { Diary, DiaryLocation } from '../../types/diary';
import { diaryService } from '../../services/diary.service';
import DiaryCard from '../../components/diary/DiaryCard';
import Layout from '../../components/layout/Layout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/auth';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const DiaryListPage: NextPage = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<{
    location?: DiaryLocation;
    feeling?: string;
    gameLevel?: number;
  }>({});

  useEffect(() => {
    // Only fetch diaries if the user is authenticated
    if (isAuthenticated) {
      fetchDiaries();
    } else if (!loading) {
      setError('Please log in to access your diary entries');
    }
  }, [isAuthenticated]);

  const fetchDiaries = async () => {
    setLoading(true);
    try {
      const data = await diaryService.getDiaries();
      setDiaries(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch diaries:', err);

      // Handle authentication errors
      if (err.response?.status === 401) {
        setError('Please log in to access your diary entries');
        // Clear tokens if they are invalid
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/login?returnUrl=/diary');
        }, 3000);
      } else {
        setError('Failed to load your diary entries. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

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

  const filteredDiaries = diaries.filter(diary => {
    let matches = true;
    
    if (filter.location && diary.location !== filter.location) {
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
      <div className="diary-list-container">
        <div className="header-section">
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
            <div className="filters-container">
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
                      {Object.values(DiaryLocation).map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
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
              <div className="loading-container">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <>
                {filteredDiaries.length === 0 ? (
                  <div className="no-diaries">
                    <p>No diary entries found. Create your first entry!</p>
                    <Link href="/diary/create" className="btn btn-primary">
                      Create Diary Entry
                    </Link>
                  </div>
                ) : (
                  <div className="diary-grid">
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
      <style jsx>{`
        .diary-list-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .filters-container {
          background-color: #f8f9fa;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 8px;
        }
        
        .diary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        
        .loading-container {
          display: flex;
          justify-content: center;
          padding: 50px 0;
        }
        
        .no-diaries {
          text-align: center;
          padding: 50px 0;
        }
        
        @media (max-width: 768px) {
          .diary-grid {
            grid-template-columns: 1fr;
          }
          
          .header-section {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .header-section a {
            margin-top: 10px;
          }
        }
      `}</style>
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