"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Toolbar } from "@/components/toolbar";
import { Cover } from "@/components/cover";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import { useMemo } from "react";

interface DocumentIDPageProps {
  params: { documentID: Id<"documents"> };
}

const DocumentIDPage = ({ params }: DocumentIDPageProps) => {
  const Editor = useMemo(() => dynamic(() => import("@/components/Editor"), { ssr: false }), []);
  const update = useMutation(api.documents.update);

  const onUpdate = (content: string) => {
    update({ id: params.documentID, content: content });
  };

  const document = useQuery(api.documents.getDocumentById, {
    documentID: params.documentID,
  });

  if (document === undefined) {
    return (
      <div className='md:max-w-3xl lg:max-w-4xl mx-auto mt-10'>
        <Cover.Skeleton />
        <div className='space-y-4 pl-8 pt-4'>
          <Skeleton className='h-14 w-[50%]' />
          <Skeleton className='h-4 w-[80%]' />
          <Skeleton className='h-4 w-[40%]' />
          <Skeleton className='h-4 w-[60%]' />
        </div>
      </div>
    );
  }

  if (document === null) {
    return <div>Document not found</div>;
  }

  return (
    <div className='pb-40'>
      <Cover preview url={document.coverImage} />
      <div className='md:max-w-3xl lg:max-w-4xl mx-auto'>
        <Toolbar preview initialData={document} />
        <Editor editable={false} onChange={onUpdate} initialContent={document.content} />
      </div>
    </div>
  );
};

export default DocumentIDPage;
