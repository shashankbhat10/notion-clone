"use client";

import { ChevronsLeft, MenuIcon, Plus, PlusCircle, Search, Settings, Trash } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ElementRef, useEffect, useRef, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import { cn } from "@/lib/utils";
import UserItem from "./UserItem";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Item from "./Item";
import { toast } from "sonner";
import DocumentList from "./DocumentList";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TrashBox } from "./TrashBox";
import { useSearch } from "@/hooks/use-search";
import { useSettings } from "@/hooks/use-settings";
import { Navbar } from "./Navbar";

const Navigation = () => {
  const search = useSearch();
  const settings = useSettings();
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const isResizingRef = useRef(false);
  const sidebarRef = useRef<ElementRef<"aside">>(null);
  const navbarRef = useRef<ElementRef<"div">>(null);
  const [isResetting, updateIsResetting] = useState(false);
  const [isCollapsed, updateIsCollapsed] = useState(isMobile);

  const create = useMutation(api.documents.create);

  useEffect(() => {
    if (isMobile) {
      collapse();
    } else {
      resetWidth();
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      collapse();
    }
  }, [pathname, isMobile]);

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizingRef.current) return;

    let newWidth = e.clientX;
    if (newWidth < 240) newWidth = 240;
    if (newWidth > 480) newWidth = 480;

    if (navbarRef.current && sidebarRef.current) {
      sidebarRef.current.style.width = `${newWidth}px`;
      navbarRef.current.style.setProperty("left", `${newWidth}px`);
      navbarRef.current.style.setProperty("width", `calc(100% - ${newWidth}px)`);
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    isResizingRef.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();

    isResizingRef.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const resetWidth = () => {
    if (sidebarRef.current && navbarRef.current) {
      updateIsCollapsed(false);
      updateIsResetting(true);

      sidebarRef.current.style.width = isMobile ? "100%" : "240px";
      navbarRef.current.style.setProperty("width", isMobile ? "0" : "calc(100% - 240px)");
      navbarRef.current.style.setProperty("left", isMobile ? "100%" : "240px");
    }

    setTimeout(() => updateIsResetting(false), 300);
  };

  const createHandler = () => {
    const res = create({ title: "Untitled Note" }).then((docID) => router.push(`/documents/${docID}`));
    toast.promise(res, {
      loading: "Creating a note",
      success: "New note created successfully",
      error: "There was an error while creating new note",
    });
  };

  const collapse = () => {
    if (sidebarRef.current && navbarRef.current) {
      updateIsCollapsed(true);
      updateIsResetting(true);

      sidebarRef.current.style.width = "0";
      navbarRef.current.style.setProperty("left", "0");
      navbarRef.current.style.setProperty("width", "100%");

      setTimeout(() => updateIsResetting(false), 300);
    }
  };

  return (
    <>
      <aside
        ref={sidebarRef}
        className={cn(
          "group/sidebar h-full bg-secondary overflow-y-auto relative flex w-60 flex-col z-[99999]",
          isResetting && "transition-all ease-in-out duration-300",
          isMobile && "w-0"
        )}>
        <div
          role='button'
          className={cn(
            "h-6 w-6 text-muted-foreground rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600 absolute top-3 right-2 opacity-0 group-hover/sidebar:opacity-100 transition",
            isMobile && "opacity-100"
          )}
          onClick={collapse}>
          <ChevronsLeft className='h-6 w-6' />
        </div>
        <div>
          <UserItem />
          <Item label='Search' icon={Search} isSearch onClick={search.onOpen} />
          <Item label='Settings' icon={Settings} onClick={settings.onOpen} />
          <Item onClick={createHandler} label='New Page' icon={PlusCircle} />
        </div>
        <div className='mt-4'>
          <DocumentList />
          <Item onClick={createHandler} icon={Plus} label='Add a Page' />
          <Popover>
            <PopoverTrigger className='w-full mt-4'>
              <Item label='Trash' icon={Trash} />
            </PopoverTrigger>
            <PopoverContent className='p-0 w-72' side={isMobile ? "bottom" : "right"}>
              <TrashBox />
            </PopoverContent>
          </Popover>
        </div>
        <div
          className='opacity-0 group-hover/sidebar:opacity-100 transition cursor-ew-resize absolute h-full w-1 bg-primary/10 right-0 top-0'
          onMouseDown={handleMouseDown}
          onClick={resetWidth}
        />
      </aside>
      <div
        ref={navbarRef}
        className={cn(
          "absolute top-0 z-[99999] left-60 w-[calc(100%-240px]",
          isResetting && "transition-all ease-in-out duration-300",
          isMobile && "left-0 w-full"
        )}>
        {!!params.documentID ? (
          <Navbar isCollapsed={isCollapsed} resetWidth={resetWidth} />
        ) : (
          <nav className='bg-transparent px-3 py-2 w-full'>
            {isCollapsed && <MenuIcon className='h-6 w-6 text-muted-foreground' role='button' onClick={resetWidth} />}
          </nav>
        )}
      </div>
    </>
  );
};

export default Navigation;
