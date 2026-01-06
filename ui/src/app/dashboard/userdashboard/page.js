'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function BookSessionContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  return <div>{id}</div>;
}

export default function BookSession() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookSessionContent />
    </Suspense>
  );
}

