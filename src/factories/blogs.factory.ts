import { BlogViewModelClass, BlogViewModelClassPagination } from "../entities/blogs.entity";
import { BlogClass } from "../schemas/blogs.schema";
import { BlogClassPaginationDto } from "../dtos/blogs.dto";

export class BlogsFactory {
    static async createBlogViewModelClass(blog: BlogClass): Promise<BlogViewModelClass> {
        return new BlogViewModelClass(
            blog.id.toString(),
            blog.name,
            blog.description,
            blog.websiteUrl,
            blog.createdAt,
            blog.isMembership,
        );
    }

    static async createBlogViewModelPaginationClass(
        dto: BlogClassPaginationDto,
    ): Promise<BlogViewModelClassPagination> {
        dto.items.forEach((elem) => (elem.id = elem.id.toString()));
        return new BlogViewModelClassPagination(dto.pagesCount, dto.page, dto.pageSize, dto.totalCount, dto.items);
    }
}
