import { PostsClass } from "../schemas/posts.schema";
import { PostViewModelClass, PostViewModelClassPagination } from "../entities/posts.entity";
import { PostClassPaginationDto } from "../dtos/posts.dto";

export class PostsFactory {
    static async createPostViewModelClass(post: PostsClass): Promise<PostViewModelClass> {
        const correctLikes = [];
        if (post.lastLikes) {
            correctLikes.push(...post.lastLikes.slice(0, 3));
            correctLikes.map(({ id, ...rest }) => rest);
        }
        return new PostViewModelClass(
            post.id.toString(),
            post.title,
            post.shortDescription,
            post.content,
            post.blogId.toString(),
            // post.blogName,
            post.createdAt,
            {
                likesCount: 0,
                dislikesCount: 0,
                myStatus: "None",
                newestLikes: [],
            },
        );
    }

    static async createPostViewModelClassPagination(
        dto: PostClassPaginationDto,
    ): Promise<PostViewModelClassPagination> {
        const result = await Promise.all(
            dto.items.map((elem) => {
                return PostsFactory.createPostViewModelClass(elem);
            }),
        );
        return new PostViewModelClassPagination(dto.pagesCount, dto.page, dto.pageSize, dto.totalCount, result);
    }
}

// {
//     likesCount: Number(post.likesCount),
//         dislikesCount: Number(post.dislikesCount),
//     myStatus: post.myStatus,
//     newestLikes: correctLikes,
// },
