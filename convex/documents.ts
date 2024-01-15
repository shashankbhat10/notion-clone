import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export const create = mutation({
  args: {
    title: v.string(),
    parentDocument: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) throw new Error("Not authenticated");

    const userID = identity.subject;

    const document = await ctx.db.insert("documents", {
      title: args.title,
      parentDocument: args.parentDocument,
      userID: userID,
      isArchived: false,
      isPublished: false,
    });

    return document;
  },
});

export const getSidebar = query({
  args: {
    parentDocument: v.optional(v.id("documents")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject;
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user_parent", (q) => q.eq("userID", userId).eq("parentDocument", args.parentDocument))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .collect();

    return documents;
  },
});

export const archive = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userID = identity.subject;

    const existingDocument = await ctx.db.get(args.id);
    if (!existingDocument) throw new Error("Document not found");

    if (existingDocument.userID !== userID) throw new Error("User not authorized to modify document");

    const recursiveArchive = async (documentID: Id<"documents">) => {
      const children = await ctx.db
        .query("documents")
        .withIndex("by_user_parent", (q) => q.eq("userID", userID).eq("parentDocument", documentID))
        .collect();

      for (const child of children) {
        await ctx.db.patch(child._id, {
          isArchived: true,
        });

        await recursiveArchive(child._id);
      }
    };

    const document = await ctx.db.patch(args.id, {
      isArchived: true,
    });

    recursiveArchive(args.id);

    return document;
  },
});

export const getTrash = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) throw new Error("User not authenticated");

    const userID = identity.subject;
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userID", userID))
      .filter((q) => q.eq(q.field("isArchived"), true))
      .order("desc")
      .collect();

    return documents;
  },
});

export const restore = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) throw new Error("User not authenticated");
    const userID = identity.subject;

    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) throw new Error("Document not found");

    if (existingDocument.userID !== userID) throw new Error("User not authorized to modify this document");

    const options: Partial<Doc<"documents">> = {
      isArchived: false,
    };

    const recursiveRestore = async (documentID: Id<"documents">) => {
      const children = await ctx.db
        .query("documents")
        .withIndex("by_user_parent", (q) => q.eq("userID", userID).eq("parentDocument", documentID))
        .collect();

      for (const child of children) {
        await ctx.db.patch(child._id, {
          isArchived: false,
        });
        await recursiveRestore(child._id);
      }
    };

    if (existingDocument.parentDocument) {
      const parent = await ctx.db.get(existingDocument.parentDocument);
      if (parent?.isArchived) {
        options.parentDocument = undefined;
      }
    }

    const document = await ctx.db.patch(args.id, options);

    recursiveRestore(args.id);

    return document;
  },
});

export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("User not authenticated");
    const userID = identity.subject;

    const existingDocument = await ctx.db.get(args.id);
    if (!existingDocument) throw new Error("Document not found");

    if (existingDocument.userID !== userID) throw new Error("User not authorized to modify this document");

    const document = await ctx.db.delete(args.id);

    return document;
  },
});

export const getSearch = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) throw new Error("User not authenticated");
    const userID = identity.subject;

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userID", userID))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .collect();

    return documents;
  },
});

export const getDocumentById = query({
  args: { documentID: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    const document = await ctx.db.get(args.documentID);
    if (!document) throw new Error("Document not found");

    if (document.isPublished && !document.isArchived) return document;

    if (!identity) throw new Error("User not authenticated");
    const userID = identity.subject;

    if (document.userID !== userID) throw new Error("User not authorized to access the document");

    return document;
  },
});

export const update = mutation({
  args: {
    id: v.id("documents"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    icon: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) throw new Error("User not authenticated");
    const userID = identity.subject;

    const { id, ...rest } = args;

    const existingDocument = await ctx.db.get(args.id);
    if (!existingDocument) throw new Error("document not found");

    if (existingDocument.userID !== userID) throw new Error("User not authorized");

    const document = await ctx.db.patch(args.id, { ...rest });

    return document;
  },
});

export const removeIcon = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("User not authenticated");
    const userID = identity.subject;

    const existingDocument = await ctx.db.get(args.id);
    if (!existingDocument) throw new Error("Document not found");
    if (existingDocument.userID !== userID) throw new Error("User not authorized to modify this document");

    const document = await ctx.db.patch(args.id, { icon: undefined });

    return document;
  },
});

export const removeCoverImage = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("User not authenticated");

    const userID = identity.subject;
    const existingDocument = await ctx.db.get(args.id);

    if (!existingDocument) throw new Error("Document not found");
    if (existingDocument.userID !== userID) throw new Error("User not authorized to modify document");

    const document = await ctx.db.patch(args.id, {
      coverImage: undefined,
    });

    return document;
  },
});
