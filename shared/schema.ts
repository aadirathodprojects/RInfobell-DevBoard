import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  uuid,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Posts table for coding doubts
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  imageUrl: text("image_url"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comments table
export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comment votes table
export const commentVotes = pgTable("comment_votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  commentId: uuid("comment_id").notNull().references(() => comments.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  voteType: varchar("vote_type", { length: 10 }).notNull(), // 'up' or 'helpful'
  createdAt: timestamp("created_at").defaultNow(),
});

// Tips table
export const tips = pgTable("tips", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  postedBy: varchar("posted_by").notNull().references(() => users.id),
  likes: integer("likes").default(0),
  pinned: boolean("pinned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tip likes table
export const tipLikes = pgTable("tip_likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tipId: uuid("tip_id").notNull().references(() => tips.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  tips: many(tips),
  commentVotes: many(commentVotes),
  tipLikes: many(tipLikes),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.createdBy],
    references: [users.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  votes: many(commentVotes),
}));

export const commentVotesRelations = relations(commentVotes, ({ one }) => ({
  comment: one(comments, {
    fields: [commentVotes.commentId],
    references: [comments.id],
  }),
  user: one(users, {
    fields: [commentVotes.userId],
    references: [users.id],
  }),
}));

export const tipsRelations = relations(tips, ({ one, many }) => ({
  author: one(users, {
    fields: [tips.postedBy],
    references: [users.id],
  }),
  likes: many(tipLikes),
}));

export const tipLikesRelations = relations(tipLikes, ({ one }) => ({
  tip: one(tips, {
    fields: [tipLikes.tipId],
    references: [tips.id],
  }),
  user: one(users, {
    fields: [tipLikes.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolved: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertTipSchema = createInsertSchema(tips).omit({
  id: true,
  createdAt: true,
  likes: true,
  pinned: true,
});

export const insertCommentVoteSchema = createInsertSchema(commentVotes).omit({
  id: true,
  createdAt: true,
});

export const insertTipLikeSchema = createInsertSchema(tipLikes).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type PostWithAuthor = Post & { author: User; commentCount: number };
export type Comment = typeof comments.$inferSelect;
export type CommentWithAuthor = Comment & { author: User; voteCount: number };
export type Tip = typeof tips.$inferSelect;
export type TipWithAuthor = Tip & { author: User };
export type InsertPost = z.infer<typeof insertPostSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertTip = z.infer<typeof insertTipSchema>;
export type InsertCommentVote = z.infer<typeof insertCommentVoteSchema>;
export type InsertTipLike = z.infer<typeof insertTipLikeSchema>;
