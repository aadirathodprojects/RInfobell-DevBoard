import {
  users,
  posts,
  comments,
  tips,
  commentVotes,
  tipLikes,
  type User,
  type UpsertUser,
  type Post,
  type PostWithAuthor,
  type Comment,
  type CommentWithAuthor,
  type Tip,
  type TipWithAuthor,
  type InsertPost,
  type InsertComment,
  type InsertTip,
  type InsertCommentVote,
  type InsertTipLike,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, ilike, or, count } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Post operations
  createPost(post: InsertPost): Promise<Post>;
  getPosts(filters?: { category?: string; resolved?: boolean; search?: string }): Promise<PostWithAuthor[]>;
  getPost(id: string): Promise<PostWithAuthor | undefined>;
  updatePost(id: string, updates: Partial<Post>): Promise<Post | undefined>;
  togglePostResolved(id: string, userId: string): Promise<Post | undefined>;
  
  // Comment operations
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsByPost(postId: string): Promise<CommentWithAuthor[]>;
  
  // Comment vote operations
  voteComment(vote: InsertCommentVote): Promise<void>;
  removeCommentVote(commentId: string, userId: string): Promise<void>;
  
  // Tips operations
  createTip(tip: InsertTip): Promise<Tip>;
  getTips(): Promise<TipWithAuthor[]>;
  likeTip(tipId: string, userId: string): Promise<void>;
  unlikeTip(tipId: string, userId: string): Promise<void>;
  
  // Stats
  getStats(): Promise<{ openDoubts: number; resolvedToday: number; tipsShared: number }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Post operations
  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async getPosts(filters?: { category?: string; resolved?: boolean; search?: string }): Promise<PostWithAuthor[]> {
    let conditions = [];
    
    // Apply filters
    if (filters?.category) {
      conditions.push(eq(posts.category, filters.category));
    }
    if (filters?.resolved !== undefined) {
      conditions.push(eq(posts.resolved, filters.resolved));
    }
    if (filters?.search) {
      conditions.push(
        or(
          ilike(posts.title, `%${filters.search}%`),
          ilike(posts.description, `%${filters.search}%`)
        )
      );
    }

    const baseQuery = db
      .select({
        id: posts.id,
        title: posts.title,
        description: posts.description,
        category: posts.category,
        imageUrl: posts.imageUrl,
        createdBy: posts.createdBy,
        resolved: posts.resolved,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        commentCount: sql<number>`cast(count(${comments.id}) as int)`,
      })
      .from(posts)
      .leftJoin(users, eq(posts.createdBy, users.id))
      .leftJoin(comments, eq(posts.id, comments.postId))
      .groupBy(posts.id, users.id);

    let finalQuery = baseQuery;
    if (conditions.length > 0) {
      finalQuery = finalQuery.where(and(...conditions));
    }
    const result = await finalQuery.orderBy(desc(posts.createdAt));
    
    return result as PostWithAuthor[];
  }

  async getPost(id: string): Promise<PostWithAuthor | undefined> {
    const [result] = await db
      .select({
        id: posts.id,
        title: posts.title,
        description: posts.description,
        category: posts.category,
        imageUrl: posts.imageUrl,
        createdBy: posts.createdBy,
        resolved: posts.resolved,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        commentCount: sql<number>`cast(count(${comments.id}) as int)`,
      })
      .from(posts)
      .leftJoin(users, eq(posts.createdBy, users.id))
      .leftJoin(comments, eq(posts.id, comments.postId))
      .where(eq(posts.id, id))
      .groupBy(posts.id, users.id);

    return result as PostWithAuthor | undefined;
  }

  async updatePost(id: string, updates: Partial<Post>): Promise<Post | undefined> {
    const [updatedPost] = await db
      .update(posts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return updatedPost;
  }

  async togglePostResolved(id: string, userId: string): Promise<Post | undefined> {
    // Only allow the post creator to toggle resolution
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    if (!post || post.createdBy !== userId) {
      return undefined;
    }

    const [updatedPost] = await db
      .update(posts)
      .set({ resolved: !post.resolved, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return updatedPost;
  }

  // Comment operations
  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async getCommentsByPost(postId: string): Promise<CommentWithAuthor[]> {
    const result = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        userId: comments.userId,
        content: comments.content,
        createdAt: comments.createdAt,
        author: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        voteCount: sql<number>`cast(count(${commentVotes.id}) as int)`,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .leftJoin(commentVotes, eq(comments.id, commentVotes.commentId))
      .where(eq(comments.postId, postId))
      .groupBy(comments.id, users.id)
      .orderBy(desc(comments.createdAt));

    return result as CommentWithAuthor[];
  }

  // Comment vote operations
  async voteComment(vote: InsertCommentVote): Promise<void> {
    await db.insert(commentVotes).values(vote).onConflictDoNothing();
  }

  async removeCommentVote(commentId: string, userId: string): Promise<void> {
    await db
      .delete(commentVotes)
      .where(
        and(
          eq(commentVotes.commentId, commentId),
          eq(commentVotes.userId, userId)
        )
      );
  }

  // Tips operations
  async createTip(tip: InsertTip): Promise<Tip> {
    const [newTip] = await db.insert(tips).values(tip).returning();
    return newTip;
  }

  async getTips(): Promise<TipWithAuthor[]> {
    const result = await db
      .select({
        id: tips.id,
        content: tips.content,
        postedBy: tips.postedBy,
        likes: tips.likes,
        pinned: tips.pinned,
        createdAt: tips.createdAt,
        author: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(tips)
      .leftJoin(users, eq(tips.postedBy, users.id))
      .orderBy(desc(tips.pinned), desc(tips.createdAt));

    return result as TipWithAuthor[];
  }

  async likeTip(tipId: string, userId: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.insert(tipLikes).values({ tipId, userId }).onConflictDoNothing();
      await tx
        .update(tips)
        .set({ likes: sql`${tips.likes} + 1` })
        .where(eq(tips.id, tipId));
    });
  }

  async unlikeTip(tipId: string, userId: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .delete(tipLikes)
        .where(and(eq(tipLikes.tipId, tipId), eq(tipLikes.userId, userId)));
      await tx
        .update(tips)
        .set({ likes: sql`${tips.likes} - 1` })
        .where(eq(tips.id, tipId));
    });
  }

  // Stats
  async getStats(): Promise<{ openDoubts: number; resolvedToday: number; tipsShared: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [openDoubtsResult] = await db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.resolved, false));

    const [resolvedTodayResult] = await db
      .select({ count: count() })
      .from(posts)
      .where(
        and(
          eq(posts.resolved, true),
          sql`${posts.updatedAt} >= ${today}`
        )
      );

    const [tipsSharedResult] = await db
      .select({ count: count() })
      .from(tips);

    return {
      openDoubts: openDoubtsResult.count,
      resolvedToday: resolvedTodayResult.count,
      tipsShared: tipsSharedResult.count,
    };
  }
}

export const storage = new DatabaseStorage();
