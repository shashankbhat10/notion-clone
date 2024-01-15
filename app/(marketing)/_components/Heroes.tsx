import Image from "next/image";

export const Heroes = () => {
  return (
    <div className='flex flex-col items-center justify-center max-w-5xl'>
      <div className='flex items-center'>
        <div className='relative w-[300px] h-[200px] sm:w-[350px] sm:h-[200px] md:w-[700px] md:h-[300px]'>
          <Image src='/home-hero.webp' alt='Home Hero image' className='object-contain' fill />
        </div>
        <div></div>
      </div>
    </div>
  );
};
