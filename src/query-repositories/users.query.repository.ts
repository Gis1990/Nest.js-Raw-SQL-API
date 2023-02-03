import { Injectable } from "@nestjs/common";
import { UsersClass } from "../schemas/users.schema";
import {
    ModelForGettingAllBannedUsersForBlog,
    ModelForGettingAllUsers,
    UserModelClass,
    UsersClassPaginationDto,
} from "../dtos/users.dto";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Injectable()
export class UsersQueryRepository {
    constructor(@InjectDataSource() private dataSource: DataSource) {}

    async getAllUsers(dto: ModelForGettingAllUsers): Promise<UsersClassPaginationDto> {
        const {
            banStatus = "all",
            searchLoginTerm = null,
            searchEmailTerm = null,
            pageNumber = 1,
            pageSize = 10,
            sortBy = "createdAt",
            sortDirection = "desc",
        } = dto;
        const sort = sortDirection === "desc" ? ` DESC` : ` ASC`;
        const offset = pageSize * (pageNumber - 1);
        const queryParams: any = [pageSize, offset];
        const queryParamsForCount = [];
        let whereClause = "";
        let whereClauseForCount = "";
        if (searchLoginTerm) {
            whereClause += `WHERE login LIKE $1 ORDER BY "${sortBy}" ${sort} LIMIT $2 OFFSET $3`;
            whereClauseForCount += `WHERE login LIKE $1`;
            queryParams.unshift(`%${searchLoginTerm}%`);
            queryParamsForCount.unshift(`%${searchLoginTerm}%`);
        }
        if (searchEmailTerm) {
            if (whereClause === "") {
                whereClause += `WHERE email LIKE $1 ORDER BY "${sortBy}" ${sort} LIMIT $2 OFFSET $3`;
                whereClauseForCount += `WHERE email LIKE $1`;
                queryParams.unshift(`%${searchLoginTerm}%`);
                queryParamsForCount.unshift(`%${searchLoginTerm}%`);
            } else {
                whereClause = `WHERE login LIKE $1 AND email LIKE $2 ORDER BY "${sortBy}" ${sort} LIMIT $3 OFFSET $4`;
                whereClauseForCount = `WHERE login LIKE $1 AND email LIKE $2`;
                queryParams.splice(1, 0, `%${searchEmailTerm}%`);
                queryParamsForCount.splice(1, 0, `%${searchEmailTerm}%`);
            }
        } else {
            if (whereClause === "") {
                whereClause += `ORDER BY "${sortBy}" ${sort} LIMIT $1 OFFSET $2`;
            }
        }
        const query = `SELECT id,login,email,"createdAt","isBanned","banDate","banReason" FROM users  
        ${whereClause}  ${
            banStatus === "banned"
                ? `AND  "isBanned" = true`
                : banStatus === "notBanned"
                ? `AND "isBanned" = false`
                : ""
        } `;
        const queryForCount = `SELECT COUNT(*) FROM users          
         ${whereClauseForCount}  ${
            banStatus === "banned" ? `AND "isBanned" = true` : banStatus === "notBanned" ? `AND "isBanned" = false` : ""
        }`;
        console.log(query);
        const cursor = await this.dataSource.query(query, queryParams);
        const totalCount = await this.dataSource.query(queryForCount, queryParamsForCount);
        return {
            pagesCount: Math.ceil(Number(totalCount[0].count) / pageSize),
            page: pageNumber,
            pageSize: pageSize,
            totalCount: Number(totalCount[0].count),
            items: cursor,
        };
    }

    async GetAllBannedUsersForBlog(
        dto: ModelForGettingAllBannedUsersForBlog,
        blogId: number,
    ): Promise<UsersClassPaginationDto> {
        const {
            searchLoginTerm = null,
            pageNumber = 1,
            pageSize = 10,
            sortBy = "createdAt",
            sortDirection = "desc",
        } = dto;
        const sort = sortDirection === "desc" ? `DESC` : `ASC`;
        const offset = pageSize * (pageNumber - 1);
        const queryParamsForBannedUsers: any = [blogId, true, pageSize, offset];
        const queryParamsForCountForBannedUsers: any = [blogId, true];
        let whereClause = "";
        let whereClauseForCount = "";
        if (searchLoginTerm) {
            whereClause += `AND login LIKE $3 ORDER BY "${sortBy}" ${sort} LIMIT $4 OFFSET $5`;
            whereClauseForCount += `AND login LIKE $3`;
            queryParamsForBannedUsers.splice(2, 0, `%${searchLoginTerm}%`);
            queryParamsForCountForBannedUsers.push(`%${searchLoginTerm}%`);
        } else {
            whereClause += ` ORDER BY "${sortBy}" ${sort} LIMIT $3 OFFSET $4`;
        }
        const query = `SELECT u.id,u.login,bb."isBanned",bb."banDate",bb."banReason" FROM users u JOIN "bannedBlogs" bb ON u.id = bb."userId" WHERE bb."blogId" = $1 AND bb."isBanned" = $2 
        ${whereClause}`;
        const cursor = await this.dataSource.query(query, queryParamsForBannedUsers);
        const totalCount = await this.dataSource.query(
            `SELECT COUNT(*) FROM users u JOIN "bannedBlogs" bb ON u.id = bb."userId" WHERE bb."blogId" = $1 AND bb."isBanned" = $2 ${whereClauseForCount}`,
            queryParamsForCountForBannedUsers,
        );
        return {
            pagesCount: Math.ceil(Number(totalCount[0].count) / pageSize),
            page: pageNumber,
            pageSize: pageSize,
            totalCount: Number(totalCount[0].count),
            items: cursor,
        };
    }

    async getUserById(id: string | undefined): Promise<UserModelClass | null> {
        let correctId;
        if (id) {
            correctId = Number(id);
        }
        if (!Number.isInteger(correctId)) {
            return null;
        }
        const user = await this.dataSource.query(`SELECT * FROM users WHERE id = $1 `, [id]);
        const devices = await this.dataSource.query(
            `SELECT ip,"lastActiveDate", "deviceId",title FROM devices WHERE "userId" = $1 `,
            [id],
        );
        const bannedBlogs = await this.dataSource.query(`SELECT * FROM "bannedBlogs" WHERE "userId" = $1 `, [id]);
        if (!user[0]) {
            return null;
        }
        const correctUser = {
            id: user[0].id,
            login: user[0].login,
            email: user[0].email,
            userDevicesData: devices,
            currentSession: {
                ip: user[0].ip,
                lastActiveDate: user[0].lastActiveDate,
                deviceId: user[0].deviceId,
                title: user[0].title,
            },
            banInfo: {
                isBanned: user[0].isBanned,
                banDate: user[0].banDate,
                banReason: user[0].banReason,
            },
            banInfoForBlogs: bannedBlogs,
        };
        return correctUser;
    }

    async getUserByDeviceId(deviceId: string): Promise<UserModelClass | null> {
        const devices = await this.dataSource.query(`SELECT * FROM devices WHERE "deviceId" = $1 `, [deviceId]);
        const user = await this.dataSource.query(`SELECT * FROM users WHERE id = $1 `, [devices[0].userId]);
        if (!user[0]) {
            return null;
        }
        const correctUser = {
            id: user[0].id,
            login: user[0].login,
            email: user[0].email,
            userDevicesData: devices,
            currentSession: {
                ip: user[0].ip,
                lastActiveDate: user[0].lastActiveDate,
                deviceId: user[0].deviceId,
                title: user[0].title,
            },
            banInfo: {
                isBanned: user[0].isBanned,
                banDate: user[0].banDate,
                banReason: user[0].banReason,
            },
        };
        return correctUser || null;
    }

    async getUserByLoginOrEmail(loginOrEmail: string): Promise<UsersClass | null> {
        const result = await this.dataSource.query(`SELECT * FROM users WHERE login = $1 OR email = $1`, [
            loginOrEmail,
        ]);
        return result[0] || null;
    }

    async getUserByConfirmationCode(emailConfirmationCode: string): Promise<UsersClass | null> {
        const result = await this.dataSource.query(`SELECT * FROM users WHERE "emailConfirmationCode"=$1`, [
            emailConfirmationCode,
        ]);
        return result[0] || null;
    }

    async getUserByRecoveryCode(recoveryCode: string): Promise<UsersClass | null> {
        const result = await this.dataSource.query(`SELECT * FROM users WHERE "emailRecoveryCode" = $1`, [
            recoveryCode,
        ]);
        return result[0] || null;
    }
}
