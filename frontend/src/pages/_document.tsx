import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';
import Script from 'next/script';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html>
        <Head>
          {/* Load wallet extension guard script */}
          {/* Removed synchronous script that was causing build error */}
        </Head>
        <body>
          <Main />
          <NextScript />
          {/* Using Next.js Script component with proper strategy */}
          <Script src="/patches/wallet-guard.js" strategy="beforeInteractive" />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
