import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import Layout from '../../../components/layout/Layout';
import DiaryForm from '../../../components/diary/DiaryForm';
import { useRouter } from 'next/router';
import { diaryService } from '../../../services/api/diary-service';
import { Diary } from '../../../types/diary';
import { ExtendedDiary } from '../../../types/diary-extended';
import Link from 'next/link';

const EditDiaryPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [diary, setDiary] = useState<ExtendedDiary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the diary entry when ID is available
    if (id) {
      fetchDiary(id as string);
    }
  }, [id]);

  const fetchDiary = async (diaryId: string) => {
    try {
      const data = await diaryService.getDiary(diaryId);
      // Convert to ExtendedDiary if needed
      setDiary(data as unknown as ExtendedDiary);
    } catch (err) {
      console.error('Error fetching diary entry:', err);
      setError('Failed to load the diary entry. It may have been deleted or you don\'t have permission to view it.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mt-4">
        <div className="mb-4">
          <Link href="/diary" className="btn btn-outline-secondary">
            ← Back to Diary List
          </Link>
        </div>
        
        {loading ? (
          <div className="d-flex justify-content-center my-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger">
            {error}
            <div className="mt-3">
              <Link href="/diary" className="btn btn-outline-primary">
                Return to Diary List
              </Link>
            </div>
          </div>
        ) : diary ? (
          <div className="card">
            <div className="card-body">
              <h1 className="mb-4">Edit Diary Entry</h1>
              <DiaryForm initialData={diary} isEdit={true} />
            </div>
          </div>
        ) : (
          <div className="alert alert-warning">
            Diary entry not found
            <div className="mt-3">
              <Link href="/diary" className="btn btn-outline-primary">
                Return to Diary List
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EditDiaryPage;