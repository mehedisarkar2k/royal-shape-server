import { array, boolean, object, string, TypeOf } from "zod";

export const createBlogSchema = object({
  body: object({
    title: string().min(1, "Title is required").max(200, "Title is too long"),
    author: string().min(1, "Author is required"),
    briefDescription: string().min(1, "Brief description is required"),
    content: string().min(1, "Content is required"),
    category: string().min(1, "Category is required"),
    tags: array(string()).optional(),
    featuredImage: string().min(1, "Featured image is required"),
    shouldPublishImmediately: boolean()
  })
});
export type CreateBlogInput = TypeOf<typeof createBlogSchema>["body"];
