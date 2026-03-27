import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Вебинары | Рутина Хаб',
  description: 'Управление вебинарами и автоматическая генерация контента.',
};

export default function WebinarsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
