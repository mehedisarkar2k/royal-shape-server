import { getModelForClass, ModelOptions, Prop } from "@typegoose/typegoose";
import { ReminderChannel } from "../constants";

class ReminderSettings {
  @Prop({ required: true, type: String, enum: ReminderChannel, default: ReminderChannel.EMAIL })
  reminder24Hour: ReminderChannel;

  @Prop({ required: true, type: String, enum: ReminderChannel, default: ReminderChannel.EMAIL })
  reminder2Hour: ReminderChannel;
}

@ModelOptions({ schemaOptions: { collection: "admin_settings", timestamps: true } })
export class AdminSettings {
  @Prop({ required: true, type: ReminderSettings, _id: false, default: () => new ReminderSettings() })
  reminders: ReminderSettings;
}

export const AdminSettingsModel = getModelForClass(AdminSettings);
export type AdminSettingsDocument = AdminSettings & Document;
