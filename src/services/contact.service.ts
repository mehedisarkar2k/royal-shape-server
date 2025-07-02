import { ContactFormSubmission, ContactFormSubmissionModel } from "../model";

export async function createContact(data: ContactFormSubmission) {
  return ContactFormSubmissionModel.create(data);
}

export async function getAllContactSubmission() {
  return ContactFormSubmissionModel.find();
}
