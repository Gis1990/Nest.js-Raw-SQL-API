import { Args, Int, Mutation, Query, Resolver } from "@nestjs/graphql";
import { GetAllBlogsCommand } from "../../queries/blogs/get-all-blogs-query";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { BlogViewModelClass, BlogViewModelClassPagination, InputModelForCreatingBlogGQl } from "./blogs.model";
import { UseGuards } from "@nestjs/common";
import { JwtAccessTokenAuthGuard } from "../../guards/jwtAccessToken-auth.guard";
import { CurrentUser } from "../../decorators/auth/auth.custom.decorators";
import { CurrentUserModel } from "../../dtos/auth.dto";
import { CreateBlogCommand } from "../../commands/blogs/create-blog-use-case";
import { GraphQLError } from "graphql/error";

@Resolver()
export class BlogsResolver {
    constructor(private readonly queryBus: QueryBus, private readonly commandBus: CommandBus) {}

    @Query(() => BlogViewModelClassPagination)
    async getAllBlogs(
        @Args({ name: "searchNameTerm", type: () => String, nullable: true })
        searchNameTerm: string,
        @Args({ name: "pageNumber", type: () => Int, nullable: true })
        pageNumber: number,
        @Args({ name: "pageSize", type: () => Int, nullable: true })
        pageSize: number,
        @Args({ name: "sortBy", type: () => String, nullable: true })
        sortBy: string,
        @Args({ name: "sortDirection", type: () => String, nullable: true })
        sortDirection: string,
    ): Promise<BlogViewModelClassPagination> {
        return await this.queryBus.execute(
            new GetAllBlogsCommand({
                searchNameTerm,
                pageNumber,
                pageSize,
                sortBy,
                sortDirection,
            }),
        );
    }

    @UseGuards(JwtAccessTokenAuthGuard)
    @Mutation(() => BlogViewModelClass)
    async createBlog(
        @Args("dto") dto: InputModelForCreatingBlogGQl,
        @CurrentUser() user: CurrentUserModel,
    ): Promise<BlogViewModelClass> {
        try {
            return await this.commandBus.execute(new CreateBlogCommand(dto, user));
        } catch (error) {
            throw new GraphQLError("Failed to create blog: " + error.message);
        }
    }
}
