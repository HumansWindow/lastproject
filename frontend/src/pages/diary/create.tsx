import React from 'react';
import { NextPage } from 'next';
import Layout from '../../components/layout/Layout';
import DiaryForm from '../../components/diary/DiaryForm';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const CreateDiaryPage: NextPage = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if user is authenticated (has a token)
    const token = localStorage.getItem('token');
    if (!token) {
      // Redirect to login if not authenticated
      router.push('/login?redirect=/diary/create');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container mt-5">
          <div className="alert alert-info">
            Checking authentication...
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mt-4">
        <div className="mb-4">
          <Link href="/diary" className="btn btn-outline-secondary">
            ← Back to Diary List
          </Link>
        </div>
        
        <div className="card">
          <div className="card-body">
            <DiaryForm />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateDiaryPage;