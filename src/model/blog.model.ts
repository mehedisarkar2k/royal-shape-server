import { ModelOptions, Prop } from "@typegoose/typegoose";
import { BlogStatus } from "../constants";

export class Like {
  @Prop({ required: true, type: String })
  customerId: string;

  @Prop({ required: true, type: String })
  customerName: string;
}

export class Comment {
  @Prop({ required: true, type: String })
  customerId: string;

  @Prop({ required: true, type: String })
  customerName: string;

  @Prop({ required: true, type: String })
  content: string;
}

@ModelOptions({ schemaOptions: { collection: "blogs", timestamps: true } })
export class Blog {
  @Prop({ required: true, type: String })
  title: string;

  @Prop({ required: true, type: String })
  briefDescription: string;

  @Prop({ required: true, type: String })
  content: string;

  @Prop({ required: true, type: String })
  author: string;

  @Prop({ required: true, type: String })
  category: string;

  @Prop({ required: false, type: Array<string>, default: [] })
  tags?: string[];

  @Prop({ required: true, type: String })
  featuredImage: string;

  @Prop({ required: true, type: String, enum: BlogStatus })
  status: BlogStatus;

  @Prop({ required: false, type: Date, default: null })
  publishedAt?: Date;

  @Prop({ required: true, type: Number, default: 0 })
  numberOfViews: number;

  @Prop({ required: false, type: Array<Like>, default: [], _id: false })
  likes?: Like[] | [];

  @Prop({ required: false, type: Array<Comment>, default: [], _id: false })
  comments?: Comment[] | [];
}
