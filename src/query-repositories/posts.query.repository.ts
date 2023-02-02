import { Injectable } from "@nestjs/common";
import { PostsClass } from "../schemas/posts.schema";
import { ModelForGettingAllPosts, PostClassPaginationDto } from "../dtos/posts.dto";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Injectable()
export class PostsQueryRepository {
    constructor(@InjectDataSource() private dataSource: DataSource) {}

    async getAllPosts(dto: ModelForGettingAllPosts, userId: string | undefined): Promise<PostClassPaginationDto> {
        if (userId) {
            Number(userId);
        }
        const { pageNumber = 1, pageSize = 10, sortBy = "createdAt", sortDirection = "desc" } = dto;
        const sort = sortDirection === "desc" ? `DESC` : `ASC`;
        const offset = pageSize * (pageNumber - 1);
        const queryParamsForAllPosts: any = [userId, pageSize, offset];
        const query = `SELECT posts.*, COUNT("usersWhoPutLikeForPost"."postId") AS "likesCount", COUNT("usersWhoPutDislikeForPost"."postId") AS "dislikesCount",
        CASE
        WHEN EXISTS (SELECT 1 FROM "usersWhoPutLikeForPost" WHERE "postId" = posts.id AND "userId" = $1) THEN 'Like'
        WHEN EXISTS (SELECT 1 FROM "usersWhoPutDislikeForPost" WHERE "postId" = posts.id AND "userId" = $1) THEN 'Dislike'
        ELSE 'None'
        END AS "myStatus",
        (SELECT array_agg("usersWhoPutLikeForPost" ORDER BY "addedAt" DESC )
         FROM "usersWhoPutLikeForPost"
         WHERE "postId" = posts.id
        ) AS "lastLikes"
        FROM posts
        JOIN users ON posts."postOwnerUserId" = users.id
        JOIN blogs ON posts."blogId" = blogs.id
        LEFT JOIN "usersWhoPutLikeForPost" ON "posts".id = "usersWhoPutLikeForPost"."postId"
        LEFT JOIN "usersWhoPutDislikeForPost" ON "posts".id = "usersWhoPutDislikeForPost"."postId"
        WHERE users."isBanned" = false
        AND blogs."isBanned" = false
        AND users.id NOT IN (
        SELECT "userId" FROM "bannedBlogs" WHERE "userId" = users.id)
        GROUP BY posts.id
        ORDER BY posts."${sortBy}" ${sort} LIMIT $2 OFFSET $3`;

        const cursor = await this.dataSource.query(query, queryParamsForAllPosts);

        const totalCount = await this.dataSource.query(
            `SELECT COUNT(*) FROM posts 
        JOIN users ON posts."postOwnerUserId" = users.id 
        JOIN blogs ON posts."blogId" = blogs.id 
        WHERE users."isBanned" = false 
        AND blogs."isBanned" = false 
        AND users.id NOT IN (
        SELECT "userId" FROM "bannedBlogs" WHERE "userId" = users.id)`,
        );
        return {
            pagesCount: Math.ceil(Number(totalCount[0].count) / pageSize),
            page: pageNumber,
            pageSize: pageSize,
            totalCount: Number(totalCount[0].count),
            items: cursor,
        };
    }

    async getAllPostsForSpecificBlog(
        dto: ModelForGettingAllPosts,
        blogId: number,
        userId: string | undefined,
    ): Promise<PostClassPaginationDto> {
        if (userId) {
            Number(userId);
        }
        const { pageNumber = 1, pageSize = 10, sortBy = "createdAt", sortDirection = "desc" } = dto;
        const sort = sortDirection === "desc" ? `DESC` : `ASC`;
        const offset = pageSize * (pageNumber - 1);
        const queryParamsForAllPostsForSpecificBlog: any = [userId, blogId, pageSize, offset];
        const query = `SELECT posts.*, COUNT("usersWhoPutLikeForPost"."postId") AS "likesCount", COUNT("usersWhoPutDislikeForPost"."postId") AS "dislikesCount",
        CASE
        WHEN EXISTS (SELECT 1 FROM "usersWhoPutLikeForPost" WHERE "postId" = posts.id AND "userId" = $1) THEN 'Like'
        WHEN EXISTS (SELECT 1 FROM "usersWhoPutDislikeForPost" WHERE "postId" = posts.id AND "userId" = $1) THEN 'Dislike'
        ELSE 'None'
        END AS "myStatus",
        (
        SELECT array_agg("usersWhoPutLikeForPost" ORDER BY "addedAt" DESC )
        FROM "usersWhoPutLikeForPost"
        WHERE "postId" = posts.id
        ) AS "lastLikes"
        FROM posts
        JOIN users ON posts."postOwnerUserId" = users.id
        JOIN blogs ON posts."blogId" = blogs.id
        LEFT JOIN "usersWhoPutLikeForPost" ON "posts".id = "usersWhoPutLikeForPost"."postId"
        LEFT JOIN "usersWhoPutDislikeForPost" ON "posts".id = "usersWhoPutDislikeForPost"."postId"
        WHERE users."isBanned" = false
        AND blogs."isBanned" = false
        AND posts."blogId" = $2
        AND users.id NOT IN (
        SELECT "userId" FROM "bannedBlogs" WHERE "userId" = users.id)
        GROUP BY posts.id
        ORDER BY posts."${sortBy}" ${sort} LIMIT $3 OFFSET $4`;

        const cursor = await this.dataSource.query(query, queryParamsForAllPostsForSpecificBlog);

        const totalCount = await this.dataSource.query(
            `SELECT COUNT(*) FROM posts 
        JOIN users ON posts."postOwnerUserId" = users.id 
        JOIN blogs ON posts."blogId" = blogs.id 
        WHERE users."isBanned" = false 
        AND blogs."isBanned" = false 
        AND posts."blogId" = $1
        AND users.id NOT IN (
        SELECT "userId" FROM "bannedBlogs" WHERE "userId" = users.id)`,
            [blogId],
        );
        return {
            pagesCount: Math.ceil(Number(totalCount[0].count) / pageSize),
            page: pageNumber,
            pageSize: pageSize,
            totalCount: Number(totalCount[0].count),
            items: cursor,
        };
    }

    async getPostById(id: number, userId: string | undefined): Promise<PostsClass | null> {
        if (userId) {
            Number(userId);
        }
        const result = await this.dataSource.query(
            `SELECT posts.*, COUNT("usersWhoPutLikeForPost"."postId") AS "likesCount", COUNT("usersWhoPutDislikeForPost"."postId") AS "dislikesCount",
        CASE
        WHEN EXISTS (SELECT 1 FROM "usersWhoPutLikeForPost" WHERE "postId" = posts.id AND "userId" = $1) THEN 'Like'
        WHEN EXISTS (SELECT 1 FROM "usersWhoPutDislikeForPost" WHERE "postId" = posts.id AND "userId" = $1) THEN 'Dislike'
        ELSE 'None'
        END AS "myStatus",
        (
        SELECT array_agg("usersWhoPutLikeForPost" ORDER BY "addedAt" DESC)
        FROM "usersWhoPutLikeForPost"
        WHERE "postId" = posts.id
        ) AS "lastLikes"
        FROM posts
        JOIN users ON posts."postOwnerUserId" = users.id
        JOIN blogs ON posts."blogId" = blogs.id
        LEFT JOIN "usersWhoPutLikeForPost" ON "posts".id = "usersWhoPutLikeForPost"."postId"
        LEFT JOIN "usersWhoPutDislikeForPost" ON "posts".id = "usersWhoPutDislikeForPost"."postId"
        WHERE users."isBanned" = false
        AND blogs."isBanned" = false
        AND posts.id = $2
        AND users.id NOT IN (
        SELECT "userId" FROM "bannedBlogs" WHERE "userId" = users.id)
        GROUP BY posts.id`,
            [userId, id],
        );
        return result[0] || null;
    }

    async getPostByIdForOperationWithLikes(id: number): Promise<PostsClass | null> {
        const result = await this.dataSource.query(`SELECT * FROM posts WHERE id = $1`, [id]);
        if (!result[0]) {
            return null;
        } else {
            result[0].likesArray = await this.dataSource.query(
                `SELECT * FROM "usersWhoPutLikeForPost" WHERE "postId" = $1`,
                [id],
            );
            result[0].dislikesArray = await this.dataSource.query(
                `SELECT * FROM "usersWhoPutDislikeForPost" WHERE "postId" = $1`,
                [id],
            );
            return result[0];
        }
    }
}
