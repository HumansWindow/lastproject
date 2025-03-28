import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import { useAuth } from '@/contexts/auth';

export default function Home() {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  
  return (
    <>
      <Head>
        <title>AliveHuman</title>
        <meta name="description" content="AliveHuman - Web3 Platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <div className="container">
          <h1>{t('welcome')}</h1>
          {user ? (
            <p>{t('loggedInAs', { email: user.email || user.walletAddress })}</p>
          ) : (
            <p>{t('notLoggedIn')}</p>
          )}
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale = 'en' }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
};
