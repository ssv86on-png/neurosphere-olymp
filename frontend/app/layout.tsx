import { AuthProvider } from '../components/index';

export const metadata = {
  title: 'НейроСфера — Олимпиады',
  description: 'AI-олимпиады с задачами, рейтингом и AI-тьютором',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" async />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#0f172a' }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
