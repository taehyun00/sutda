'use client'; 

import { useRouter } from 'next/navigation'


export default function Home() {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center w-[100vh] bg-[#434343] h-[30vh]">
      <h1>BSSM 섯다</h1>
      <button onClick={() => router.push('/room')}>입장</button>
    </div>
  )
} 