import { Module } from "@nestjs/common";
import { config } from "./config/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { BlogsModule } from "./modules/blogs/blogs.module";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { CqrsModule } from "@nestjs/cqrs";
import { BloggerModule } from "./modules/blogger/blogger.module";
import { SuperAdminModule } from "./modules/super-admin/super.admin.module";
import { AuthModule } from "./modules/auth/auth.module";
import { TestingModule } from "./modules/testing(delete all)/testing.module";
import { SecurityModule } from "./modules/security/security.module";
import { CommentsModule } from "./modules/comments/comments.module";
import { PostsModule } from "./modules/posts/posts.module";

@Module({
    imports: [
        CqrsModule,
        TypeOrmModule.forRoot({
            type: "postgres",
            host: "localhost",
            port: 5432,
            username: "nodejs",
            password: "nodejs",
            database: "Bloggers",
            autoLoadEntities: false,
            synchronize: false,
        }),
        ConfigModule.forRoot({ isGlobal: true, load: [config] }),
        // ThrottlerModule.forRoot({
        //     ttl: 10,
        //     limit: 5,
        // }),
        BlogsModule,
        PostsModule,
        AuthModule,
        CommentsModule,
        TestingModule,
        SecurityModule,
        BloggerModule,
        SuperAdminModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        // {
        //     provide: APP_GUARD,
        //     useClass: ThrottlerGuard,
        // },
    ],
})
export class AppModule {}
