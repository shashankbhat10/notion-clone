"use client";

import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { Spinner } from "@/components/spinner";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Search, Trash, Undo } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export const TrashBox = () => {
  const router = useRouter();
  const params = useParams();
  const documents = useQuery(api.documents.getTrash);
  const restore = useMutation(api.documents.restore);
  const remove = useMutation(api.documents.remove);

  const [search, updateSearch] = useState("");

  const filteredDocuments = documents?.filter((document) => {
    return document.title.toLowerCase().includes(search.toLowerCase());
  });

  const onClick = (documentID: string) => {
    router.push(`/documents/${documentID}`);
  };

  const onRestore = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, documentID: Id<"documents">) => {
    e.stopPropagation();

    const promise = restore({ id: documentID });

    toast.promise(promise, {
      loading: "Restoring Note...",
      success: "Note successfully restored",
      error: "There was an issue while restoring the note",
    });
  };

  const onRemove = (documentID: Id<"documents">) => {
    const promise = remove({ id: documentID });

    toast.promise(promise, {
      loading: "Deleting Note...",
      success: "Note successfully deleted",
      error: "There was an issue while deleting the note",
    });

    if (params.documentID === documentID) router.push("/documents");
  };

  if (documents === undefined) {
    return (
      <div className='h-full flex items-center justify-center p-4'>
        <Spinner size='lg' />
      </div>
    );
  }

  return (
    <div className='text-sm'>
      <div className='flex items-center gap-x-1 p-2'>
        <Search className='h-4 w-4' />
        <Input
          value={search}
          onChange={(e) => updateSearch(e.target.value)}
          className='h-7 px-2 focus-visible:ring-transparent bg-secondary'
          placeholder='Filter by title'
        />
      </div>
      <div className='mt-2 px-1 pb-1'>
        <p className='hidden last:block text-xs text-center text-muted-foreground pb-2'>No documents found</p>
        {filteredDocuments?.map((doc) => (
          <div
            role='button'
            key={doc._id}
            onClick={() => onClick(doc._id)}
            className='text-sm rounded-sm w-full hover:bg-primary/5 flex items-center text-primary justify-between'>
            <span className='truncate pl-2'>{doc.title}</span>
            <div className='flex items-center'>
              <div
                onClick={(e) => onRestore(e, doc._id)}
                role='button'
                className='rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600'>
                <Undo className='w-4 h-4 text-muted-foreground' />
              </div>
              <ConfirmModal onConfirm={() => onRemove(doc._id)}>
                <div role='button' className='rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600'>
                  <Trash className='h-4 w-4 text-muted-foreground' />
                </div>
              </ConfirmModal>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
