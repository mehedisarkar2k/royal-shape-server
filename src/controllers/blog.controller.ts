import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { CreateBlogInput } from "../schemas";
import { ApplicationServices, BlogStatus, DATA_NOT_FOUND, UNEXPECTED_ERROR } from "../constants";
import { BlogModel } from "../model";
import { DateTime } from "luxon";
import { SendErrorResponse, SendResponse } from "../utils";

const buildErrorPayload = (
  endpoint: string,
  functionName: string,
  method: string,
  message: string,
  error: { code: string; message: string },
  customMsg: string
) => ({
  message,
  data: {
    clientError: { ...error, message: customMsg },
    endpoint,
    functionName,
    method,
    service: ApplicationServices.BLOG,
    id: uuid()
  }
});

export async function createBlogHandler(
  req: Request<Record<string, never>, Record<string, never>, CreateBlogInput>,
  res: Response
) {
  const functionName = createBlogHandler.name;
  const data = req.body;

  const AUSTRALIA_TZ = "Australia/Sydney";
  const now = DateTime.now().setZone(AUSTRALIA_TZ);

  const blog = await BlogModel.create({
    author: data.author.trim(),
    title: data.title.trim(),
    briefDescription: data.briefDescription.trim(),
    content: data.content.trim(),
    category: data.category.trim(),
    tags: data.tags?.map((tag) => tag.trim()) || [],
    featuredImage: data.featuredImage,
    status: data.shouldPublishImmediately ? BlogStatus.PUBLISHED : BlogStatus.DRAFT,
    publishedAt: data.shouldPublishImmediately ? now.toJSDate() : null,
    numberOfViews: 0,
    likes: [],
    comments: []
  });

  if (!blog) {
    return SendErrorResponse.internalServer({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Failed to create blog",
        UNEXPECTED_ERROR,
        "Failed to create blog"
      )
    });
  }

  return SendResponse.success({
    res,
    message: "Blog created successfully",
    data: {
      blog: {
        id: blog._id.toString()
      }
    }
  });
}

export async function getAllBlogsHandler(req: Request, res: Response) {
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "10", 10);

  const skip = (page - 1) * limit;

  const totalBlogs = await BlogModel.countDocuments({});
  const blogs = await BlogModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
  const totalPages = Math.ceil(totalBlogs / limit);
  const hasNext = page < totalPages;

  return SendResponse.success({
    res,
    message: "Blogs fetched successfully",
    data: {
      items: blogs.map((blog) => ({
        id: blog._id.toString(),
        title: blog.title,
        briefDescription: blog.briefDescription,
        author: blog.author,
        category: blog.category,
        tags: blog.tags,
        featuredImage: blog.featuredImage,
        status: blog.status,
        publishedAt: blog.status === BlogStatus.PUBLISHED ? blog.publishedAt?.toISOString().split("T")[0] : null,
        numberOfViews: blog.numberOfViews
      })),
      currentPage: page,
      limit,
      totalPages,
      totalItems: totalBlogs,
      hasNext
    }
  });
}

export async function getSingleBlogHandler(req: Request, res: Response) {
  const functionName = getSingleBlogHandler.name;
  const { blogId } = req.params;

  const blog = await BlogModel.findById(blogId).lean();

  if (!blog) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Blog not found",
        DATA_NOT_FOUND,
        `No blog found with ID: ${blogId}`
      )
    });
  }

  return SendResponse.success({
    res,
    message: "Blog fetched successfully",
    data: {
      blog: {
        id: blog._id.toString(),
        title: blog.title,
        briefDescription: blog.briefDescription,
        content: blog.content,
        author: blog.author,
        category: blog.category,
        tags: blog.tags,
        featuredImage: blog.featuredImage,
        status: blog.status,
        publishedAt: blog.status === BlogStatus.PUBLISHED ? blog.publishedAt?.toISOString().split("T")[0] : null,
        numberOfViews: blog.numberOfViews
      }
    }
  });
}

export async function editBlogHandler(req: Request, res: Response) {
  const functionName = editBlogHandler.name;
  const { blogId } = req.params;
  const data = req.body;

  const blog = await BlogModel.findById(blogId);

  if (!blog) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Blog not found",
        DATA_NOT_FOUND,
        `No blog found with ID: ${blogId}`
      )
    });
  }

  blog.title = data.title?.trim() || blog.title;
  blog.briefDescription = data.briefDescription?.trim() || blog.briefDescription;
  blog.content = data.content?.trim() || blog.content;
  blog.category = data.category?.trim() || blog.category;
  blog.tags = data.tags ? data.tags.map((tag: string) => tag.trim()) : blog.tags;
  blog.featuredImage = data.featuredImage || blog.featuredImage;

  await blog.save();

  return SendResponse.success({
    res,
    message: "Blog updated successfully",
    data: null
  });
}

export async function deleteBlogHandler(req: Request, res: Response) {
  const functionName = deleteBlogHandler.name;
  const { blogId } = req.params;

  const blog = await BlogModel.findById(blogId);

  if (!blog) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Blog not found",
        DATA_NOT_FOUND,
        `No blog found with ID: ${blogId}`
      )
    });
  }

  await BlogModel.findByIdAndDelete(blogId);

  return SendResponse.success({
    res,
    message: "Blog deleted successfully",
    data: null
  });
}

export async function toggleBlogStatusHandler(req: Request, res: Response) {
  const functionName = toggleBlogStatusHandler.name;
  const { blogId } = req.params;

  const blog = await BlogModel.findById(blogId);

  if (!blog) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Blog not found",
        DATA_NOT_FOUND,
        `No blog found with ID: ${blogId}`
      )
    });
  }

  blog.status = blog.status === BlogStatus.PUBLISHED ? BlogStatus.DRAFT : BlogStatus.PUBLISHED;
  await blog.save();

  return SendResponse.success({
    res,
    message: "Blog status updated successfully",
    data: {
      blog: {
        id: blog._id.toString(),
        title: blog.title,
        status: blog.status
      }
    }
  });
}

export async function getAllPublicBlogsHandler(req: Request, res: Response) {
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "10", 10);

  const skip = (page - 1) * limit;

  const totalBlogs = await BlogModel.countDocuments({ status: BlogStatus.PUBLISHED });

  const blogs = await BlogModel.find({ status: BlogStatus.PUBLISHED })
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(limit);
  const totalPages = Math.ceil(totalBlogs / limit);
  const hasNext = page < totalPages;

  return SendResponse.success({
    res,
    message: "Public blogs fetched successfully",
    data: {
      items: blogs.map((blog) => ({
        id: blog._id.toString(),
        title: blog.title,
        briefDescription: blog.briefDescription,
        author: blog.author,
        category: blog.category,
        tags: blog.tags,
        featuredImage: blog.featuredImage,
        publishedAt: blog.publishedAt?.toISOString().split("T")[0]
      })),
      currentPage: page,
      limit,
      totalPages,
      totalItems: totalBlogs,
      hasNext
    }
  });
}

export async function getSinglePublicBlogHandler(req: Request, res: Response) {
  const functionName = getSinglePublicBlogHandler.name;
  const { blogId } = req.params;

  const blog = await BlogModel.findOne({ _id: blogId, status: BlogStatus.PUBLISHED });

  if (!blog) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Public blog not found",
        DATA_NOT_FOUND,
        `No public blog found with ID: ${blogId}`
      )
    });
  }

  // Increment the number of views
  blog.numberOfViews += 1;
  await blog.save();

  return SendResponse.success({
    res,
    message: "Public blog fetched successfully",
    data: {
      blog: {
        id: blog._id.toString(),
        title: blog.title,
        briefDescription: blog.briefDescription,
        content: blog.content,
        author: blog.author,
        category: blog.category,
        tags: blog.tags,
        featuredImage: blog.featuredImage,
        publishedAt: blog.publishedAt?.toISOString().split("T")[0]
      }
    }
  });
}
