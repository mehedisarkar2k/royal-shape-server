import { Request, Response } from "express";
import { ContactFormSubmitType } from "../schemas";
import { createContact } from "../services";
import { sendContactUsEmail, SendResponse } from "../utils";

export async function contactFormSubmitHandler(
  req: Request<Record<string, never>, Record<string, never>, ContactFormSubmitType>,
  res: Response
) {
  const data = req.body;
  const contact = await createContact(data);
  await sendContactUsEmail(data);
  return SendResponse.success({
    res,
    message: "Submitted contact form successfully",
    data: {
      contact: { id: contact._id.toString() }
    }
  });
}
