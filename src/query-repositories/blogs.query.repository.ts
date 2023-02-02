import { Injectable } from "@nestjs/common";
import { BlogViewModelClass } from "../entities/blogs.entity";
import { BlogClassPaginationDto, ModelForGettingAllBlogs } from "../dtos/blogs.dto";
import { BlogClass } from "../schemas/blogs.schema";
import { DataSource } from "typeorm";
import { InjectDataSource } from "@nestjs/typeorm";
import { BannedBlogsClass } from "../schemas/users.schema";

@Injectable()
export class BlogsQueryRepository {
    constructor(@InjectDataSource() private dataSource: DataSource) {}

    async getAllBlogs(dto: ModelForGettingAllBlogs): Promise<BlogClassPaginationDto> {
        const {
            searchNameTerm = null,
            pageNumber = 1,
            pageSize = 10,
            sortBy = "createdAt",
            sortDirection = "desc",
        } = dto;
        const sort = sortDirection === "desc" ? `DESC` : `ASC`;
        const offset = pageSize * (pageNumber - 1);
        const queryParamsForAllBlogs: any = [pageSize, offset];
        const queryParamsForCountAllBlogs: any = [];
        let whereClause = "";
        let whereClauseForCount = "";
        if (searchNameTerm) {
            whereClause += `AND name LIKE $1 ORDER BY "${sortBy}" ${sort} LIMIT $2 OFFSET $3`;
            queryParamsForAllBlogs.unshift(`%${searchNameTerm}%`);
            whereClauseForCount += `AND name LIKE $1`;
            queryParamsForCountAllBlogs.push(`%${searchNameTerm}%`);
        } else {
            whereClause += `ORDER BY "${sortBy}" ${sort} LIMIT $1 OFFSET $2`;
        }
        const query = `SELECT id,name,description,"websiteUrl", "createdAt" FROM blogs WHERE "isBanned" = false ${whereClause}`;
        const cursor = await this.dataSource.query(query, queryParamsForAllBlogs);

        const totalCount = await this.dataSource.query(
            `SELECT COUNT(*) FROM blogs WHERE "isBanned" = false ${whereClauseForCount}`,
            queryParamsForCountAllBlogs,
        );
        return {
            pagesCount: Math.ceil(Number(totalCount[0].count) / pageSize),
            page: pageNumber,
            pageSize: pageSize,
            totalCount: Number(totalCount[0].count),
            items: cursor,
        };
    }

    async getAllBlogsForAuthorizedUser(dto: ModelForGettingAllBlogs, userId: number): Promise<BlogClassPaginationDto> {
        const {
            searchNameTerm = null,
            pageNumber = 1,
            pageSize = 10,
            sortBy = "createdAt",
            sortDirection = "desc",
        } = dto;
        const sort = sortDirection === "desc" ? `DESC` : `ASC`;
        const offset = pageSize * (pageNumber - 1);
        const queryParamsForAllBlogsForAuthorizedUser: any = [userId, pageSize, offset];
        const queryParamsForCountAllBlogsForAuthorizedUser: any = [userId];
        let whereClause = "";
        let whereClauseForCount = "";
        if (searchNameTerm) {
            whereClause += `AND name LIKE $2 ORDER BY "${sortBy}" ${sort} LIMIT $3 OFFSET $4`;
            queryParamsForAllBlogsForAuthorizedUser.splice(1, 0, `%${searchNameTerm}%`);
            whereClauseForCount += `AND name LIKE $2`;
            queryParamsForCountAllBlogsForAuthorizedUser.push(`%${searchNameTerm}%`);
        } else {
            whereClause += `ORDER BY "${sortBy}" ${sort} LIMIT $2 OFFSET $3`;
        }
        const query = `SELECT id,name,description,"websiteUrl", "createdAt" FROM blogs WHERE "isBanned" = false AND "blogOwnerUserId"=$1 ${whereClause}`;
        const cursor = await this.dataSource.query(query, queryParamsForAllBlogsForAuthorizedUser);
        const totalCount = await this.dataSource.query(
            `SELECT COUNT(*) FROM blogs WHERE "isBanned" = false AND "blogOwnerUserId"=$1 ${whereClauseForCount}`,
            queryParamsForCountAllBlogsForAuthorizedUser,
        );
        return {
            pagesCount: Math.ceil(Number(totalCount[0].count) / pageSize),
            page: pageNumber,
            pageSize: pageSize,
            totalCount: Number(totalCount[0].count),
            items: cursor,
        };
    }

    async getAllBlogsForSuperAdmin(dto: ModelForGettingAllBlogs): Promise<BlogClassPaginationDto> {
        const {
            searchNameTerm = null,
            pageNumber = 1,
            pageSize = 10,
            sortBy = "createdAt",
            sortDirection = "desc",
        } = dto;
        const sort = sortDirection === "desc" ? `DESC` : `ASC`;
        const offset = pageSize * (pageNumber - 1);
        const queryParamsForAllBlogsForSuperAdmin: any = [pageSize, offset];
        const queryParamsForCountAllBlogsForSuperAdmin = [];
        let whereClause = "";
        let whereClauseForCount = "";
        if (searchNameTerm) {
            whereClause += `WHERE name LIKE $1 ORDER BY "${sortBy}" ${sort} LIMIT $2 OFFSET $3`;
            queryParamsForAllBlogsForSuperAdmin.unshift(`%${searchNameTerm}%`);
            whereClauseForCount += `WHERE name LIKE $1`;
            queryParamsForCountAllBlogsForSuperAdmin.push(`%${searchNameTerm}%`);
        } else {
            whereClause += `ORDER BY "${sortBy}" ${sort} LIMIT $1 OFFSET $2`;
        }
        const query = `SELECT id,name,description,"websiteUrl", "createdAt" FROM blogs ${whereClause}`;
        const cursor = await this.dataSource.query(query, queryParamsForAllBlogsForSuperAdmin);
        const totalCount = await this.dataSource.query(
            `SELECT COUNT(*) FROM blogs ${whereClauseForCount}`,
            queryParamsForCountAllBlogsForSuperAdmin,
        );
        return {
            pagesCount: Math.ceil(Number(totalCount[0].count) / pageSize),
            page: pageNumber,
            pageSize: pageSize,
            totalCount: Number(totalCount[0].count),
            items: cursor,
        };
    }

    async getBlogById(id: number): Promise<BlogClass | null> {
        const result = await this.dataSource.query(`SELECT * FROM blogs WHERE id = $1 AND "isBanned" = false`, [id]);
        return result[0] || null;
    }

    async getBlogByIdForBanUnbanOperation(id: number): Promise<BlogClass | null> {
        const result = await this.dataSource.query(`SELECT * FROM blogs WHERE id = $1`, [id]);
        return result[0] || null;
    }

    async getBlogByIdWithCorrectViewModel(id: number): Promise<BlogViewModelClass | null> {
        const result = await this.dataSource.query(
            `SELECT id, name, description, "websiteUrl", "createdAt" FROM blogs WHERE id= $1`,
            [id],
        );
        return result[0] || null;
    }

    async getBannedBlogsForUser(userId: number): Promise<BannedBlogsClass | null> {
        const result = await this.dataSource.query(`SELECT * FROM "bannedBlogs" WHERE "userId" = $1`, [userId]);
        return result[0] || null;
    }
}
