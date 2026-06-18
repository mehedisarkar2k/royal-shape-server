import { getModelForClass, ModelOptions, Prop } from "@typegoose/typegoose";

class ReminderSettings {
  @Prop({ required: true, type: Boolean, default: true })
  enable3DayReminder: boolean;

  @Prop({ required: true, type: Boolean, default: true })
  enable24HourReminder: boolean;

  @Prop({ required: true, type: Boolean, default: true })
  enable6HourReminder: boolean;
}

@ModelOptions({ schemaOptions: { collection: "admin_settings", timestamps: true } })
export class AdminSettings {
  @Prop({ required: true, type: ReminderSettings, _id: false, default: () => new ReminderSettings() })
  reminders: ReminderSettings;
}

export const AdminSettingsModel = getModelForClass(AdminSettings);
export type AdminSettingsDocument = AdminSettings & Document;
